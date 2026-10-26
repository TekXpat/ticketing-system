import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { holdSeatForUser } from "@/lib/seats/hold";
import { createOrderForUser } from "./create";

// Runs against the real database, like hold.test.ts.
describe("createOrderForUser", () => {
  const tag = randomUUID();
  const STOCK = 3;
  const BUYERS = 8;
  const PHONE = "0788123456";

  let buyerIds: string[] = [];
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
      db.user.create({
        data: { email: `order-${name}-${tag}@example.com`, passwordHash: "unused" },
      });

    const buyers = await Promise.all(
      Array.from({ length: BUYERS }, (_, i) => makeUser(`buyer${i}`)),
    );
    buyerIds = buyers.map((user) => user.id);
    userAId = (await makeUser("a")).id;
    userBId = (await makeUser("b")).id;

    const layout = await db.seatLayout.create({
      data: {
        name: `order-layout-${tag}`,
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
        title: `order-ga-${tag}`,
        kind: "concert",
        startsAt,
        ticketTypes: { create: { name: "Standard", price: 5000, quantity: STOCK } },
      },
      include: { ticketTypes: true },
    });
    const busEvent = await db.event.create({
      data: {
        title: `order-bus-${tag}`,
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

  // Each test starts with no orders and no holds.
  afterEach(async () => {
    await db.order.deleteMany({ where: { eventId: { in: [gaEventId, busEventId] } } });
    await db.seatReservation.deleteMany({ where: { eventId: busEventId } });
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { eventId: { in: [gaEventId, busEventId] } } });
    await db.event.deleteMany({ where: { id: { in: [gaEventId, busEventId] } } });
    await db.seatLayout.delete({ where: { id: layoutId } });
    await db.user.deleteMany({ where: { id: { in: [...buyerIds, userAId, userBId] } } });
    await db.$disconnect();
  });

  const gaOrder = (quantity: number) => ({
    eventId: gaEventId,
    phone: PHONE,
    items: [{ ticketTypeId: gaTypeId, quantity }],
  });

  it("never oversells: 8 simultaneous buyers fight for 3 tickets", async () => {
    const results = await Promise.all(buyerIds.map((id) => createOrderForUser(id, gaOrder(1))));

    expect(results.filter((r) => r.ok)).toHaveLength(STOCK);
    expect(results.filter((r) => !r.ok)).toHaveLength(BUYERS - STOCK);
    await expect(db.orderItem.count({ where: { ticketTypeId: gaTypeId } })).resolves.toBe(STOCK);
  });

  it("frees the stock of an order that expired unpaid", async () => {
    await db.order.create({
      data: {
        userId: userAId,
        eventId: gaEventId,
        expiresAt: new Date(Date.now() - 60_000),
        items: {
          create: Array.from({ length: STOCK }, () => ({ ticketTypeId: gaTypeId, price: 5000 })),
        },
      },
    });

    const result = await createOrderForUser(userBId, gaOrder(STOCK));

    expect(result.ok).toBe(true);
  });

  it("only lets the holder of a seat order it, and keeps the hold alive", async () => {
    const order = {
      eventId: busEventId,
      phone: PHONE,
      items: [{ ticketTypeId: busTypeId, seatIds: [seatId] }],
    };
    await holdSeatForUser(userAId, busEventId, seatId);

    const stranger = await createOrderForUser(userBId, order);
    const holder = await createOrderForUser(userAId, order);

    expect(stranger.ok).toBe(false);
    expect(holder.ok).toBe(true);
    if (!holder.ok) return;
    const reservation = await db.seatReservation.findFirst({
      where: { eventId: busEventId, seatId },
    });
    expect(reservation?.expiresAt.getTime()).toBe(holder.expiresAt.getTime());
  });
});
