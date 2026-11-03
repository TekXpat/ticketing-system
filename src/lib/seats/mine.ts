import { db } from "@/lib/db";

// Seats this user holds that are NOT already in an unpaid or paid order. Only
// these may go into a new checkout, so a seat can never be charged twice.
export async function seatsReadyToCheckOut(userId: string, eventId: string) {
  const now = new Date();
  const inOrders = await db.orderItem.findMany({
    where: {
      seatId: { not: null },
      order: {
        userId,
        eventId,
        OR: [{ status: "PAID" }, { status: "PENDING", expiresAt: { gt: now } }],
      },
    },
    select: { seatId: true },
  });
  const blocked = inOrders.flatMap((item) => (item.seatId ? [item.seatId] : []));

  return db.seatReservation.findMany({
    where: {
      eventId,
      userId,
      status: "HELD",
      expiresAt: { gt: now },
      seatId: { notIn: blocked },
    },
    include: { seat: true },
    orderBy: { seat: { label: "asc" } },
  });
}

// Unpaid orders of this user for one event, so the page can offer to pay or cancel them.
export async function myUnpaidOrders(userId: string, eventId: string) {
  return db.order.findMany({
    where: { userId, eventId, status: "PENDING", expiresAt: { gt: new Date() } },
    select: { id: true, expiresAt: true },
    orderBy: { createdAt: "asc" },
  });
}