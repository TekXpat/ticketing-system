import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createOrderForUser } from "@/lib/orders/create";
import { holdSeatForUser } from "@/lib/seats/hold";
import { expireOverdueOrders } from "./expire";
import { settlePayment } from "./settle";

// Runs against the real database, like the other tests.
describe("settlePayment", () => {
  const tag = randomUUID();
  const PHONE = "0788123456";

  let userAId: string;
  let userBId: string;
  let layoutId: string;
  let gaEventId: string;
  let gaTypeId: string;
  let busEventId: string;
  let busTypeId: string;
  let seatId: string;

  beforeAll(async () => {
    const makeUser = (name: string) =>
      db.user.create({ data: { email: `pay-${name}-${tag}@example.com`, passwordHash: "unused" } });
    userAId = (await makeUser("a")).id;
    userBId = (await makeUser("b")).id;

    const layout = await db.seatLayout.create({
      data: {
        name: `pay-layout-${tag}`,
        seats: { create: [{ label: "1A", rowIndex: 0, colIndex: 0 }] },
      },
      include: { seats: true },
    });
    const seat = layout.seats[0];
    if (!seat) throw new Error("Test setup failed: the layout has no seat.");
    layoutId = layout.id;
    seatId = seat.id;

    const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const gaEvent = await db.event.create({
      data: {
        title: `pay-ga-${tag}`,
        kind: "concert",
        startsAt,
        ticketTypes: { create: { name: "Standard", price: 5000, quantity: 10 } },
      },
      include: { ticketTypes: true },
    });
    const busEvent = await db.event.create({
      data: {
        title: `pay-bus-${tag}`,
        kind: "bus",
        startsAt,
        seatLayoutId: layout.id,
        ticketTypes: { create: { name: "Seat", price: 5000, quantity: 1, seated: true } },
      },
      include: { ticketTypes: true },
    });
    const gaType = gaEvent.ticketTypes[0];
    const busType = busEvent.ticketTypes[0];
    if (!gaType || !busType) throw new Error("Test setup failed: missing ticket type.");
    gaEventId = gaEvent.id;
    gaTypeId = gaType.id;
    busEventId = busEvent.id;
    busTypeId = busType.id;
  });

  // Deleting an event also deletes its orders, payments, tickets and holds.
  const cleanUp = () => db.order.deleteMany({ where: { eventId: { in: [gaEventId, busEventId] } } });

  afterEach(async () => {
    await cleanUp();
    await db.seatReservation.deleteMany({ where: { eventId: busEventId } });
  });

  afterAll(async () => {
    await cleanUp();
    await db.event.deleteMany({ where: { id: { in: [gaEventId, busEventId] } } });
    await db.seatLayout.delete({ where: { id: layoutId } });
    await db.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await db.$disconnect();
  });

  async function gaPayment(quantity: number) {
    const result = await createOrderForUser(userAId, {
      eventId: gaEventId,
      phone: PHONE,
      items: [{ ticketTypeId: gaTypeId, quantity }],
    });
    if (!result.ok) throw new Error(`Test setup failed: ${result.error}`);
    return result;
  }

  async function seatPayment(userId: string) {
    const hold = await holdSeatForUser(userId, busEventId, seatId);
    if (!hold.ok) throw new Error(`Test setup failed: ${hold.error}`);
    const result = await createOrderForUser(userId, {
      eventId: busEventId,
      phone: PHONE,
      items: [{ ticketTypeId: busTypeId, seatIds: [seatId] }],
    });
    if (!result.ok) throw new Error(`Test setup failed: ${result.error}`);
    return result;
  }

  it("issues exactly one set of tickets when the same callback arrives 10 times at once", async () => {
    const { providerRef, orderId } = await gaPayment(2);

    const results = await Promise.all(
      Array.from({ length: 10 }, () => settlePayment(providerRef, "success")),
    );

    expect(results.every((r) => r.ok)).toBe(true);
    expect(results.filter((r) => r.ok && !r.duplicate)).toHaveLength(1);
    await expect(db.ticket.count({ where: { eventId: gaEventId } })).resolves.toBe(2);
    const order = await db.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe("PAID");
  });

  it("turns a held seat into a sold seat with a ticket for that seat", async () => {
    const { providerRef } = await seatPayment(userAId);

    await settlePayment(providerRef, "success");

    const reservation = await db.seatReservation.findFirst({ where: { eventId: busEventId, seatId } });
    expect(reservation?.status).toBe("SOLD");
    const ticket = await db.ticket.findFirst({ where: { eventId: busEventId } });
    expect(ticket?.seatId).toBe(seatId);
  });

  it("frees the seat and issues nothing when the payment fails", async () => {
    const { providerRef, orderId } = await seatPayment(userAId);

    await settlePayment(providerRef, "failed");

    const order = await db.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe("FAILED");
    await expect(db.ticket.count({ where: { eventId: busEventId } })).resolves.toBe(0);
    const next = await holdSeatForUser(userBId, busEventId, seatId);
    expect(next.ok).toBe(true);
  });

  it("ignores a success callback that arrives after the payment already failed", async () => {
    const { providerRef } = await seatPayment(userAId);
    await settlePayment(providerRef, "failed");

    const late = await settlePayment(providerRef, "success");

    expect(late).toMatchObject({ ok: true, duplicate: true, ticketsIssued: 0 });
    await expect(db.ticket.count({ where: { eventId: busEventId } })).resolves.toBe(0);
  });

  it("expires an order whose callback never arrived and frees its seat", async () => {
    const { providerRef, orderId } = await seatPayment(userAId);
    await db.order.update({ where: { id: orderId }, data: { expiresAt: new Date(Date.now() - 60_000) } });

    const swept = await expireOverdueOrders();

    expect(swept).toBeGreaterThanOrEqual(1);
    const order = await db.order.findUnique({ where: { id: orderId } });
    const payment = await db.payment.findUnique({ where: { providerRef } });
    expect(order?.status).toBe("EXPIRED");
    expect(payment?.status).toBe("TIMED_OUT");
    await expect(db.seatReservation.count({ where: { eventId: busEventId } })).resolves.toBe(0);
  });
});