import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { settlePayment } from "@/lib/payments/settle";
import { holdSeatForUser } from "@/lib/seats/hold";
import { GATES } from "@/lib/tickets/gates";
import { createTicketCode } from "@/lib/tickets/sign";
import { verifyAndUseTicket } from "@/lib/tickets/verify";
import { createOrderForUser } from "./create";

const SECRET = "test-flow-secret";
const [BUSES, CONCERTS] = [GATES[0], GATES[1]];

// The whole journey on the real database: hold, order, pay (with repeated
// callbacks), receive a signed ticket, and use it once at the gate.
describe("buying and using a ticket, end to end", () => {
  const tag = randomUUID();
  let userId: string;
  let layoutId: string;
  let seatId: string;
  let busEventId: string;
  let busTypeId: string;
  let concertEventId: string;
  let concertTypeId: string;

  beforeAll(async () => {
    vi.stubEnv("TICKET_SIGNING_SECRET", SECRET);
    const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await db.user.create({
      data: { email: `flow-${tag}@example.com`, passwordHash: "unused" },
    });
    const layout = await db.seatLayout.create({
      data: {
        name: `flow-layout-${tag}`,
        seats: { create: [{ label: "1A", rowIndex: 0, colIndex: 0 }] },
      },
      include: { seats: true },
    });
    const seat = layout.seats[0];
    const bus = await db.event.create({
      data: {
        title: `flow-bus-${tag}`,
        kind: "bus",
        startsAt,
        seatLayoutId: layout.id,
        ticketTypes: { create: { name: "Regular", price: 5000, quantity: 1, seated: true } },
      },
      include: { ticketTypes: true },
    });
    const concert = await db.event.create({
      data: {
        title: `flow-concert-${tag}`,
        kind: "concert",
        startsAt,
        ticketTypes: { create: { name: "Standard", price: 3000, quantity: 5 } },
      },
      include: { ticketTypes: true },
    });
    const busType = bus.ticketTypes[0];
    const concertType = concert.ticketTypes[0];
    if (!seat || !busType || !concertType) throw new Error("Test setup failed.");

    userId = user.id;
    layoutId = layout.id;
    seatId = seat.id;
    busEventId = bus.id;
    busTypeId = busType.id;
    concertEventId = concert.id;
    concertTypeId = concertType.id;
  });

  afterAll(async () => {
    // Orders point at ticket types, so they must go before the events do.
    await db.order.deleteMany({ where: { eventId: { in: [busEventId, concertEventId] } } });
    await db.seatReservation.deleteMany({ where: { eventId: busEventId } });
    await db.event.deleteMany({ where: { id: { in: [busEventId, concertEventId] } } });
    await db.seatLayout.delete({ where: { id: layoutId } });
    await db.user.delete({ where: { id: userId } });
    vi.unstubAllEnvs();
    await db.$disconnect();
  });
  it("bus: hold a seat, order with a name, pay, and scan the ticket once", async () => {
    const hold = await holdSeatForUser(userId, busEventId, seatId);
    expect(hold.ok).toBe(true);

    const order = await createOrderForUser(userId, {
      eventId: busEventId,
      phone: "0788123456",
      items: [{ ticketTypeId: busTypeId, seatIds: [seatId], holderNames: ["Aline Uwase"] }],
    });
    if (!order.ok) throw new Error(order.error);

    // The provider sends the same success callback five times at once.
    const results = await Promise.all(
      Array.from({ length: 5 }, () => settlePayment(order.providerRef, "success")),
    );
    expect(results.filter((r) => r.ok && !r.duplicate)).toHaveLength(1);

    const ticket = await db.ticket.findFirstOrThrow({ where: { eventId: busEventId } });
    expect(ticket.seatId).toBe(seatId);
    const reservation = await db.seatReservation.findFirstOrThrow({
      where: { eventId: busEventId, seatId },
    });
    expect(reservation.status).toBe("SOLD");

    const code = createTicketCode(ticket);
    const first = await verifyAndUseTicket(code, BUSES, busEventId);
    const second = await verifyAndUseTicket(code, BUSES, busEventId);

    expect(first).toMatchObject({ status: "valid", holder: "Aline Uwase", seat: "1A" });
    expect(second).toMatchObject({ status: "already_used" });
  });

  it("concert: two named tickets are issued and scanned one at a time", async () => {
    const order = await createOrderForUser(userId, {
      eventId: concertEventId,
      phone: "0788123456",
      items: [{ ticketTypeId: concertTypeId, quantity: 2, holderNames: ["Aline", "Brice"] }],
    });
    if (!order.ok) throw new Error(order.error);

    await settlePayment(order.providerRef, "success");

    const tickets = await db.ticket.findMany({ where: { eventId: concertEventId } });
    expect(tickets).toHaveLength(2);

    const [one] = tickets;
    if (!one) throw new Error("Test setup failed: no ticket.");
    const result = await verifyAndUseTicket(createTicketCode(one), CONCERTS, concertEventId);

    expect(result).toMatchObject({ status: "valid", ticketType: "Standard" });
    await expect(
      db.ticket.count({ where: { eventId: concertEventId, usedAt: null } }),
    ).resolves.toBe(1);
  });
});
