import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createOrderForUser } from "./create";

// Runs against the real database, like the other tests.
describe("ticket holder names", () => {
  const tag = randomUUID();
  let userId: string;
  let eventId: string;
  let ticketTypeId: string;

  beforeAll(async () => {
    const user = await db.user.create({
      data: { email: `names-${tag}@example.com`, passwordHash: "unused" },
    });
    const event = await db.event.create({
      data: {
        title: `names-${tag}`,
        kind: "concert",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ticketTypes: { create: { name: "VIP", price: 5000, quantity: 10 } },
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
    await db.$disconnect();
  });

  it("saves one name for each ticket", async () => {
    const result = await createOrderForUser(userId, {
      eventId,
      phone: "0788123456",
      items: [{ ticketTypeId, quantity: 3, holderNames: ["Aline", "Brice", "Chantal"] }],
    });

    expect(result.ok).toBe(true);
    const items = await db.orderItem.findMany({
      where: { ticketTypeId },
      orderBy: { holderName: "asc" },
    });
    expect(items.map((item) => item.holderName)).toEqual(["Aline", "Brice", "Chantal"]);
  });

  it("refuses an order whose names do not match the number of tickets", async () => {
    const result = await createOrderForUser(userId, {
      eventId,
      phone: "0788123456",
      items: [{ ticketTypeId, quantity: 3, holderNames: ["Aline", "Brice"] }],
    });

    expect(result).toEqual({ ok: false, error: "Enter one name for every ticket." });
  });
});
