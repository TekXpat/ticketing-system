import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createOrderForUser } from "@/lib/orders/create";
import { settlePayment } from "./settle";

// Runs against the real database, like the other tests.
describe("a payment that arrives after its order expired", () => {
  const tag = randomUUID();
  const eventIds: string[] = [];
  let userAId: string;
  let userBId: string;

  async function makeEvent(quantity: number) {
    const event = await db.event.create({
      data: {
        title: `late-${tag}-${eventIds.length}`,
        kind: "concert",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ticketTypes: { create: { name: "Standard", price: 5000, quantity } },
      },
      include: { ticketTypes: true },
    });
    const type = event.ticketTypes[0];
    if (!type) throw new Error("Test setup failed: missing ticket type.");
    eventIds.push(event.id);
    return { eventId: event.id, ticketTypeId: type.id };
  }

  async function order(userId: string, eventId: string, ticketTypeId: string) {
    const result = await createOrderForUser(userId, {
      eventId,
      phone: "0788123456",
      items: [{ ticketTypeId, quantity: 1 }],
    });
    if (!result.ok) throw new Error(`Test setup failed: ${result.error}`);
    return result;
  }

  beforeAll(async () => {
    const makeUser = (name: string) =>
      db.user.create({
        data: { email: `late-${name}-${tag}@example.com`, passwordHash: "unused" },
      });
    userAId = (await makeUser("a")).id;
    userBId = (await makeUser("b")).id;
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { eventId: { in: eventIds } } });
    await db.event.deleteMany({ where: { id: { in: eventIds } } });
    await db.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await db.$disconnect();
  });

  it("does not issue a second ticket for the only place", async () => {
    const { eventId, ticketTypeId } = await makeEvent(1);

    const a = await order(userAId, eventId, ticketTypeId);
    // A never paid, and the 10 minutes ran out.
    await db.order.update({
      where: { id: a.orderId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    // So B can buy the same single ticket and pays.
    const b = await order(userBId, eventId, ticketTypeId);
    await settlePayment(b.providerRef, "success");

    // Now A's payment finally arrives.
    const late = await settlePayment(a.providerRef, "success");

    expect(late).toMatchObject({ ok: true, duplicate: false, ticketsIssued: 0 });
    await expect(db.ticket.count({ where: { eventId } })).resolves.toBe(1);
    const orderA = await db.order.findUnique({ where: { id: a.orderId } });
    expect(orderA?.status).toBe("FAILED");
  });

  it("still honours a late payment when the stock is still free", async () => {
    const { eventId, ticketTypeId } = await makeEvent(5);

    const a = await order(userAId, eventId, ticketTypeId);
    await db.order.update({
      where: { id: a.orderId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const late = await settlePayment(a.providerRef, "success");

    expect(late).toMatchObject({ ok: true, duplicate: false, ticketsIssued: 1 });
    const orderA = await db.order.findUnique({ where: { id: a.orderId } });
    expect(orderA?.status).toBe("PAID");
  });
});
