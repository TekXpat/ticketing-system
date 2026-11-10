import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createOrderForUser } from "@/lib/orders/create";
import { deleteEventForOrganiser, updateEventForOrganiser } from "./edit";

// Runs against the real database, like the other tests.
describe("editing and deleting events", () => {
  const tag = randomUUID();
  const eventIds: string[] = [];
  let organiserId: string;
  let otherId: string;
  let customerId: string;

  async function makeEvent() {
    const event = await db.event.create({
      data: {
        title: `edit-${tag}-${eventIds.length}`,
        kind: "concert",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        organiserId,
        ticketTypes: { create: { name: "Standard", price: 5000, quantity: 10 } },
      },
      include: { ticketTypes: true },
    });
    const type = event.ticketTypes[0];
    if (!type) throw new Error("Test setup failed: missing ticket type.");
    eventIds.push(event.id);
    return { eventId: event.id, typeId: type.id };
  }

  const input = (typeId: string, change: { quantity?: number; price?: number } = {}) => ({
    title: "Edited title",
    startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    ticketTypes: [
      {
        id: typeId,
        name: "Standard",
        price: change.price ?? 5000,
        quantity: change.quantity ?? 10,
        maxPerCustomer: null,
      },
    ],
  });

  async function buy(eventId: string, ticketTypeId: string, quantity: number) {
    const result = await createOrderForUser(customerId, {
      eventId,
      phone: "0788123456",
      items: [{ ticketTypeId, quantity }],
    });
    if (!result.ok) throw new Error(`Test setup failed: ${result.error}`);
  }

  beforeAll(async () => {
    const makeUser = (name: string) =>
      db.user.create({
        data: { email: `edit-${name}-${tag}@example.com`, passwordHash: "unused" },
      });
    organiserId = (await makeUser("org")).id;
    otherId = (await makeUser("other")).id;
    customerId = (await makeUser("cust")).id;
  });

  afterAll(async () => {
    // Orders point at ticket types, so they go before the events.
    await db.order.deleteMany({ where: { eventId: { in: eventIds } } });
    await db.event.deleteMany({ where: { id: { in: eventIds } } });
    await db.user.deleteMany({ where: { id: { in: [organiserId, otherId, customerId] } } });
    await db.$disconnect();
  });

  it("refuses to lower a quantity below what is already sold", async () => {
    const { eventId, typeId } = await makeEvent();
    await buy(eventId, typeId, 4);

    const result = await updateEventForOrganiser(
      organiserId,
      eventId,
      input(typeId, { quantity: 3 }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("already sold or reserved 4");
  });

  it("allows the quantity to drop to exactly what is sold", async () => {
    const { eventId, typeId } = await makeEvent();
    await buy(eventId, typeId, 4);

    const result = await updateEventForOrganiser(
      organiserId,
      eventId,
      input(typeId, { quantity: 4 }),
    );

    expect(result.ok).toBe(true);
  });

  it("changes the price for new orders but not for items already ordered", async () => {
    const { eventId, typeId } = await makeEvent();
    await buy(eventId, typeId, 2);

    await updateEventForOrganiser(organiserId, eventId, input(typeId, { price: 9000 }));

    const type = await db.ticketType.findUniqueOrThrow({ where: { id: typeId } });
    const items = await db.orderItem.findMany({ where: { ticketTypeId: typeId } });
    expect(type.price).toBe(9000);
    expect(items.map((item) => item.price)).toEqual([5000, 5000]);
  });

  it("does not let another organiser edit the event", async () => {
    const { eventId, typeId } = await makeEvent();

    const result = await updateEventForOrganiser(otherId, eventId, input(typeId));

    expect(result).toEqual({ ok: false, error: "Event not found." });
  });

  it("refuses to delete an event that has tickets reserved", async () => {
    const { eventId, typeId } = await makeEvent();
    await buy(eventId, typeId, 1);

    const result = await deleteEventForOrganiser(organiserId, eventId);

    expect(result.ok).toBe(false);
    await expect(db.event.count({ where: { id: eventId } })).resolves.toBe(1);
  });

  it("deletes an event that nobody has bought", async () => {
    const { eventId } = await makeEvent();

    const result = await deleteEventForOrganiser(organiserId, eventId);

    expect(result.ok).toBe(true);
    await expect(db.event.count({ where: { id: eventId } })).resolves.toBe(0);
  });
});