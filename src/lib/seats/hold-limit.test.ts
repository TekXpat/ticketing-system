import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { holdSeatForUser, releaseSeatForUser } from "./hold";

// Runs against the real database, like the other tests.
describe("the per-customer hold limit", () => {
  const tag = randomUUID();
  const LIMIT = 2;
  let userId: string;
  let layoutId: string;
  let eventId: string;
  let seatIds: string[];

  beforeAll(async () => {
    const user = await db.user.create({
      data: { email: `limit-${tag}@example.com`, passwordHash: "unused" },
    });
    const layout = await db.seatLayout.create({
      data: {
        name: `limit-layout-${tag}`,
        seats: {
          create: ["1A", "1B", "1C", "1D", "2A"].map((label, index) => ({
            label,
            rowIndex: 0,
            colIndex: index,
          })),
        },
      },
      include: { seats: true },
    });
    const event = await db.event.create({
      data: {
        title: `limit-${tag}`,
        kind: "bus",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        seatLayoutId: layout.id,
        ticketTypes: {
          create: {
            name: "Regular",
            price: 5000,
            quantity: 5,
            seated: true,
            maxPerCustomer: LIMIT,
          },
        },
      },
    });

    userId = user.id;
    layoutId = layout.id;
    eventId = event.id;
    seatIds = layout.seats.map((seat) => seat.id);
  });

  afterEach(() => db.seatReservation.deleteMany({ where: { eventId } }));

  afterAll(async () => {
    await db.event.delete({ where: { id: eventId } });
    await db.seatLayout.delete({ where: { id: layoutId } });
    await db.user.delete({ where: { id: userId } });
    await db.$disconnect();
  });

  it("refuses to hold more seats than the customer may buy", async () => {
    const first = await holdSeatForUser(userId, eventId, seatIds[0] ?? "");
    const second = await holdSeatForUser(userId, eventId, seatIds[1] ?? "");
    const third = await holdSeatForUser(userId, eventId, seatIds[2] ?? "");

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third).toEqual({ ok: false, error: "You can hold at most 2 seats for this event." });
    // The refused seat stays free for everyone else.
    await expect(db.seatReservation.count({ where: { eventId } })).resolves.toBe(2);
  });

  it("holds the limit even when one customer clicks five seats at once", async () => {
    const results = await Promise.all(
      seatIds.map((seatId) => holdSeatForUser(userId, eventId, seatId)),
    );

    expect(results.filter((result) => result.ok)).toHaveLength(LIMIT);
    await expect(db.seatReservation.count({ where: { eventId } })).resolves.toBe(LIMIT);
  });

  it("lets the customer hold another seat after giving one back", async () => {
    await holdSeatForUser(userId, eventId, seatIds[0] ?? "");
    await holdSeatForUser(userId, eventId, seatIds[1] ?? "");
    await releaseSeatForUser(userId, eventId, seatIds[0] ?? "");

    const again = await holdSeatForUser(userId, eventId, seatIds[2] ?? "");

    expect(again.ok).toBe(true);
  });
});
