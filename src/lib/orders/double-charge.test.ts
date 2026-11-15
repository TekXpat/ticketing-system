import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { holdSeatForUser } from "@/lib/seats/hold";
import { seatsReadyToCheckOut } from "@/lib/seats/mine";
import { createOrderForUser } from "./create";

// Runs against the real database, like the other tests.
describe("a seat is never charged twice", () => {
  const tag = randomUUID();
  let userId: string;
  let layoutId: string;
  let eventId: string;
  let ticketTypeId: string;
  let seatA: string;
  let seatB: string;

  beforeAll(async () => {
    const user = await db.user.create({
      data: { email: `twice-${tag}@example.com`, passwordHash: "unused" },
    });
    const layout = await db.seatLayout.create({
      data: {
        name: `twice-layout-${tag}`,
        seats: {
          create: [
            { label: "1A", rowIndex: 0, colIndex: 0 },
            { label: "1B", rowIndex: 0, colIndex: 1 },
          ],
        },
      },
      include: { seats: true },
    });
    const a = layout.seats.find((seat) => seat.label === "1A");
    const b = layout.seats.find((seat) => seat.label === "1B");
    if (!a || !b) throw new Error("Test setup failed: missing seats.");

    const event = await db.event.create({
      data: {
        title: `twice-${tag}`,
        kind: "bus",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        seatLayoutId: layout.id,
        // More stock than seats, so the seat rule is what stops the second order.
        ticketTypes: { create: { name: "Regular", price: 5000, quantity: 5, seated: true } },
      },
      include: { ticketTypes: true },
    });
    const type = event.ticketTypes[0];
    if (!type) throw new Error("Test setup failed: missing ticket type.");

    userId = user.id;
    layoutId = layout.id;
    eventId = event.id;
    ticketTypeId = type.id;
    seatA = a.id;
    seatB = b.id;
  });

  afterEach(async () => {
    await db.order.deleteMany({ where: { eventId } });
    await db.seatReservation.deleteMany({ where: { eventId } });
  });

  afterAll(async () => {
    await db.event.delete({ where: { id: eventId } });
    await db.seatLayout.delete({ where: { id: layoutId } });
    await db.user.delete({ where: { id: userId } });
    await db.$disconnect();
  });

  async function holdBoth() {
    await holdSeatForUser(userId, eventId, seatA);
    await holdSeatForUser(userId, eventId, seatB);
  }

  const orderFor = (seatIds: string[]) =>
    createOrderForUser(userId, {
      eventId,
      phone: "0788123456",
      items: [{ ticketTypeId, seatIds }],
    });

  it("refuses a second order that contains a seat already in the first", async () => {
    await holdBoth();
    const first = await orderFor([seatA]);
    expect(first.ok).toBe(true);

    // Checking out again with both held seats must not charge seat 1A twice.
    const second = await orderFor([seatA, seatB]);

    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("already in another order");
  });

  it("lets the second order take only the new seat", async () => {
    await holdBoth();
    await orderFor([seatA]);

    const second = await orderFor([seatB]);

    expect(second.ok).toBe(true);
  });

  it("offers only the seats that are not already in an order", async () => {
    await holdBoth();
    await orderFor([seatA]);

    const ready = await seatsReadyToCheckOut(userId, eventId);

    expect(ready.map((hold) => hold.seatId)).toEqual([seatB]);
  });
});
