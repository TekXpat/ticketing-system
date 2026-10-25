import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

const HOLD_MINUTES = 10;

export type HoldSeatResult =
  { ok: true; reservationId: string; expiresAt: Date } | { ok: false; error: string };

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

  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  try {
    const reservation = await db.$transaction(async (tx) => {
      // An expired hold still has a row, which would block the seat forever.
      await tx.seatReservation.deleteMany({
        where: {
          eventId,
          seatId,
          status: "HELD",
          expiresAt: { lt: new Date() },
        },
      });

      // Insert and let the unique (eventId, seatId) rule decide the winner.
      return tx.seatReservation.create({
        data: { eventId, seatId, userId, expiresAt },
      });
    });

    return { ok: true, reservationId: reservation.id, expiresAt };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "Sorry, that seat was just taken." };
    }
    throw error;
  }
}
