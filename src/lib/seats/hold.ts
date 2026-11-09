import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

const HOLD_MINUTES = 10;
// Used when the organiser set no per-customer limit, so one account cannot
// block a whole bus.
const DEFAULT_MAX_HOLDS = 10;

export type HoldSeatResult =
  { ok: true; reservationId: string; expiresAt: Date } | { ok: false; error: string };

export type ReleaseSeatResult = { ok: true } | { ok: false; error: string };

export async function holdSeatForUser(
  userId: string,
  eventId: string,
  seatId: string,
): Promise<HoldSeatResult> {
  // The seat must belong to the layout that this event uses.
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { seatLayoutId: true },
  });
  const seat = await db.seat.findUnique({
    where: { id: seatId },
    select: { layoutId: true },
  });
  if (!event?.seatLayoutId || !seat || seat.layoutId !== event.seatLayoutId) {
    return { ok: false, error: "That seat does not exist for this event." };
  }

  // The most seats one customer may hold or own for this event.
  const seatedTypes = await db.ticketType.findMany({
    where: { eventId, seated: true },
    select: { maxPerCustomer: true },
  });
  const limits = seatedTypes.flatMap((type) =>
    type.maxPerCustomer === null ? [] : [type.maxPerCustomer],
  );
  const limit = limits.length > 0 ? Math.min(...limits) : DEFAULT_MAX_HOLDS;

  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  try {
    const outcome = await db.$transaction(async (tx) => {
      // One customer's holds are counted one at a time, so clicking five seats
      // at once cannot slip past the limit.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

      // An expired hold still has a row, which would block the seat forever.
      await tx.seatReservation.deleteMany({
        where: {
          eventId,
          seatId,
          status: "HELD",
          expiresAt: { lt: new Date() },
        },
      });

      // Seats already paid for count as well as live holds.
      const owned = await tx.seatReservation.count({
        where: {
          eventId,
          userId,
          OR: [{ status: "SOLD" }, { status: "HELD", expiresAt: { gt: new Date() } }],
        },
      });
      if (owned >= limit) return { limited: true as const };

      // Insert and let the unique (eventId, seatId) rule decide the winner.
      const reservation = await tx.seatReservation.create({
        data: { eventId, seatId, userId, expiresAt },
      });
      return { limited: false as const, reservation };
    });

    if (outcome.limited) {
      return { ok: false, error: `You can hold at most ${limit} seats for this event.` };
    }
    return { ok: true, reservationId: outcome.reservation.id, expiresAt };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "Sorry, that seat was just taken." };
    }
    throw error;
  }
}

// Seats that belong to this user's unpaid orders. Releasing those would leave
// the order without its seat, so they are cancelled through the order instead.
async function seatsInPendingOrders(userId: string, eventId: string): Promise<string[]> {
  const items = await db.orderItem.findMany({
    where: { seatId: { not: null }, order: { userId, eventId, status: "PENDING" } },
    select: { seatId: true },
  });
  return items.flatMap((item) => (item.seatId ? [item.seatId] : []));
}

// Gives back one seat the user is holding. Only HELD rows of this user are touched.
export async function releaseSeatForUser(
  userId: string,
  eventId: string,
  seatId: string,
): Promise<ReleaseSeatResult> {
  const locked = await seatsInPendingOrders(userId, eventId);
  if (locked.includes(seatId)) {
    return { ok: false, error: "This seat is in an unpaid order. Cancel the order instead." };
  }
  await db.seatReservation.deleteMany({
    where: { eventId, seatId, userId, status: "HELD" },
  });
  return { ok: true };
}

// Gives back every seat the user holds for this event, except those in an
// unpaid order. Returns the ids that were released.
export async function releaseAllHeldSeatsForUser(
  userId: string,
  eventId: string,
): Promise<string[]> {
  const locked = await seatsInPendingOrders(userId, eventId);
  const holds = await db.seatReservation.findMany({
    where: { eventId, userId, status: "HELD", seatId: { notIn: locked } },
    select: { id: true, seatId: true },
  });
  await db.seatReservation.deleteMany({ where: { id: { in: holds.map((hold) => hold.id) } } });
  return holds.map((hold) => hold.seatId);
}
