import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { holdSeatForUser } from "@/lib/seats/hold";
import { createOrderForUser } from "./create";

// Runs against the real database, like the other tests.
describe("seat sections on one vehicle", () => {
  const tag = randomUUID();
  let userId: string;
  let layoutIds: string[] = [];
  let eventId: string;
  let businessTypeId: string;
  let economyTypeId: string;
  let businessSeat: string;
  let economySeat: string;
  let foreignSeat: string;

  beforeAll(async () => {
    const user = await db.user.create({
      data: { email: `sections-${tag}@example.com`, passwordHash: "unused" },
    });
    const layout = await db.seatLayout.create({
      data: {
        name: `sections-${tag}`,
        seats: {
          create: [
            { label: "1A", rowIndex: 0, colIndex: 0, section: "Business" },
            { label: "2A", rowIndex: 1, colIndex: 0, section: "Economy" },
          ],
        },
      },
      include: { seats: true },
    });
    const other = await db.seatLayout.create({
      data: {
        name: `sections-other-${tag}`,
        seats: { create: [{ label: "1A", rowIndex: 0, colIndex: 0, section: "Business" }] },
      },
      include: { seats: true },
    });
    const event = await db.event.create({
      data: {
        title: `sections-${tag}`,
        kind: "bus",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        seatLayoutId: layout.id,
        ticketTypes: {
          create: [
            { name: "Business", price: 15000, quantity: 1, seated: true, section: "Business" },
            { name: "Economy", price: 5000, quantity: 1, seated: true, section: "Economy" },
          ],
        },
      },
      include: { ticketTypes: true },
    });
    const business = event.ticketTypes.find((type) => type.name === "Business");
    const economy = event.ticketTypes.find((type) => type.name === "Economy");
    const bSeat = layout.seats.find((seat) => seat.section === "Business");
    const eSeat = layout.seats.find((seat) => seat.section === "Economy");
    const fSeat = other.seats[0];
    if (!business || !economy || !bSeat || !eSeat || !fSeat) throw new Error("Test setup failed.");

    userId = user.id;
    layoutIds = [layout.id, other.id];
    eventId = event.id;
    businessTypeId = business.id;
    economyTypeId = economy.id;
    businessSeat = bSeat.id;
    economySeat = eSeat.id;
    foreignSeat = fSeat.id;
  });

  afterEach(async () => {
    await db.order.deleteMany({ where: { eventId } });
    await db.seatReservation.deleteMany({ where: { eventId } });
  });

  afterAll(async () => {
    await db.event.delete({ where: { id: eventId } });
    await db.seatLayout.deleteMany({ where: { id: { in: layoutIds } } });
    await db.user.delete({ where: { id: userId } });
    await db.$disconnect();
  });

  const order = (items: { ticketTypeId: string; seatIds: string[] }[]) =>
    createOrderForUser(userId, { eventId, phone: "0788123456", items });

  it("prices each seat by its own ticket type in one order", async () => {
    await holdSeatForUser(userId, eventId, businessSeat);
    await holdSeatForUser(userId, eventId, economySeat);

    const result = await order([
      { ticketTypeId: businessTypeId, seatIds: [businessSeat] },
      { ticketTypeId: economyTypeId, seatIds: [economySeat] },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.amount).toBe(20000);
  });

  it("refuses an economy seat sold as a business ticket", async () => {
    await holdSeatForUser(userId, eventId, economySeat);

    const result = await order([{ ticketTypeId: businessTypeId, seatIds: [economySeat] }]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("is not sold as");
  });

  it("refuses a seat that belongs to a different layout", async () => {
    const result = await order([{ ticketTypeId: businessTypeId, seatIds: [foreignSeat] }]);

    expect(result).toEqual({
      ok: false,
      error: "One of these seats does not exist for this event.",
    });
  });
});
