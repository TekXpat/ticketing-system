import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { holdSeatForUser } from "./hold";

// Runs against the real database, like db.test.ts.
describe("holdSeatForUser", () => {
  const tag = randomUUID();
  let layoutId: string;
  let eventId: string;
  let seatId: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    const userA = await db.user.create({
      data: { email: `hold-a-${tag}@example.com`, passwordHash: "unused" },
    });
    const userB = await db.user.create({
      data: { email: `hold-b-${tag}@example.com`, passwordHash: "unused" },
    });
    const layout = await db.seatLayout.create({
      data: {
        name: `test-layout-${tag}`,
        seats: { create: [{ label: "1A", rowIndex: 0, colIndex: 0 }] },
      },
      include: { seats: true },
    });
    const event = await db.event.create({
      data: {
        title: `test-event-${tag}`,
        kind: "bus",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        seatLayoutId: layout.id,
      },
    });

    userAId = userA.id;
    userBId = userB.id;
    layoutId = layout.id;
    const seat = layout.seats[0];
    if (!seat) throw new Error("Test setup failed: the layout has no seat.");
    seatId = seat.id;
    eventId = event.id;
  });

  // Each test starts with the seat free.
  afterEach(() => db.seatReservation.deleteMany({ where: { eventId } }));

  afterAll(async () => {
    // Deleting the event also deletes its reservations (onDelete: Cascade).
    await db.event.delete({ where: { id: eventId } });
    await db.seatLayout.delete({ where: { id: layoutId } });
    await db.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await db.$disconnect();
  });

  it("lets exactly one of two simultaneous requests win the seat", async () => {
    const results = await Promise.all([
      holdSeatForUser(userAId, eventId, seatId),
      holdSeatForUser(userBId, eventId, seatId),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([
      { ok: false, error: "Sorry, that seat was just taken." },
    ]);
    await expect(db.seatReservation.count({ where: { eventId, seatId } })).resolves.toBe(1);
  });

  it("lets someone take a seat whose earlier hold has expired", async () => {
    await db.seatReservation.create({
      data: {
        eventId,
        seatId,
        userId: userAId,
        status: "HELD",
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const result = await holdSeatForUser(userBId, eventId, seatId);

    expect(result.ok).toBe(true);
    await expect(db.seatReservation.count({ where: { eventId, seatId } })).resolves.toBe(1);
  });

  it("does not let someone take a seat that is still held", async () => {
    await holdSeatForUser(userAId, eventId, seatId);

    const result = await holdSeatForUser(userBId, eventId, seatId);

    expect(result).toEqual({ ok: false, error: "Sorry, that seat was just taken." });
  });
});
