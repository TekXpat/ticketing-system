import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { GATES } from "./gates";
import { createTicketCode } from "./sign";
import { verifyAndUseTicket } from "./verify";

const SECRET = "test-verify-secret";
const [BUSES, CONCERTS] = [GATES[0], GATES[1]];

// Runs against the real database, like the other tests. The test event is a concert.
describe("verifyAndUseTicket", () => {
  const tag = randomUUID();
  let userId: string;
  let eventId: string;
  let ticketTypeId: string;

  beforeAll(async () => {
    vi.stubEnv("TICKET_SIGNING_SECRET", SECRET);

    const user = await db.user.create({
      data: { email: `gate-${tag}@example.com`, passwordHash: "unused" },
    });
    const event = await db.event.create({
      data: {
        title: `gate-event-${tag}`,
        kind: "concert",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ticketTypes: { create: { name: "Standard", price: 5000, quantity: 100 } },
      },
      include: { ticketTypes: true },
    });
    const type = event.ticketTypes[0];
    if (!type) throw new Error("Test setup failed: missing ticket type.");

    userId = user.id;
    eventId = event.id;
    ticketTypeId = type.id;
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { eventId } });
    await db.event.delete({ where: { id: eventId } });
    await db.user.delete({ where: { id: userId } });
    vi.unstubAllEnvs();
    await db.$disconnect();
  });

  // A paid order with one item and its ticket, as the payment step would make.
  async function newTicket() {
    const order = await db.order.create({
      data: {
        userId,
        eventId,
        status: "PAID",
        expiresAt: new Date(Date.now() + 60_000),
        items: { create: { ticketTypeId, price: 5000 } },
      },
      include: { items: true },
    });
    const item = order.items[0];
    if (!item) throw new Error("Test setup failed: missing order item.");

    const ticket = await db.ticket.create({
      data: { orderItemId: item.id, eventId, ticketTypeId },
    });
    return { id: ticket.id, ticketTypeId, seatId: null };
  }

  it("accepts a genuine ticket once, then reports it as already used", async () => {
    const ticket = await newTicket();
    const code = createTicketCode(ticket, SECRET);

    const first = await verifyAndUseTicket(code, CONCERTS);
    const second = await verifyAndUseTicket(code, CONCERTS);

    expect(first).toMatchObject({ status: "valid", ticketType: "Standard", seat: null });
    expect(second).toMatchObject({ status: "already_used", ticketType: "Standard" });
  });

  it("rejects a forged code and leaves the ticket unused", async () => {
    const ticket = await newTicket();
    const forged = createTicketCode(ticket, "attacker-guess");

    const result = await verifyAndUseTicket(forged, CONCERTS);

    expect(result).toEqual({ status: "invalid" });
    const row = await db.ticket.findUnique({ where: { id: ticket.id } });
    expect(row?.usedAt).toBeNull();
  });

  it("rejects garbage and unknown ticket ids the same way", async () => {
    expect(await verifyAndUseTicket("garbage", CONCERTS)).toEqual({ status: "invalid" });
    expect(await verifyAndUseTicket("", CONCERTS)).toEqual({ status: "invalid" });
    const unknown = createTicketCode({ id: "nope", ticketTypeId, seatId: null }, SECRET);
    expect(await verifyAndUseTicket(unknown, CONCERTS)).toEqual({ status: "invalid" });
  });

  it("lets exactly one of 10 simultaneous scans win", async () => {
    const ticket = await newTicket();
    const code = createTicketCode(ticket, SECRET);

    const results = await Promise.all(
      Array.from({ length: 10 }, () => verifyAndUseTicket(code, CONCERTS)),
    );

    expect(results.filter((r) => r.status === "valid")).toHaveLength(1);
    expect(results.filter((r) => r.status === "already_used")).toHaveLength(9);
  });

  it("refuses a concert ticket at the buses gate and does NOT mark it used", async () => {
    const ticket = await newTicket();
    const code = createTicketCode(ticket, SECRET);

    const wrong = await verifyAndUseTicket(code, BUSES);

    expect(wrong).toEqual({ status: "wrong_gate", ticketGate: "Concerts", gate: "Buses" });
    const row = await db.ticket.findUnique({ where: { id: ticket.id } });
    expect(row?.usedAt).toBeNull();
  });

  it("still lets the ticket in at the right gate after a wrong-gate attempt", async () => {
    const ticket = await newTicket();
    const code = createTicketCode(ticket, SECRET);

    await verifyAndUseTicket(code, BUSES);
    const right = await verifyAndUseTicket(code, CONCERTS);

    expect(right).toMatchObject({ status: "valid" });
  });
});
