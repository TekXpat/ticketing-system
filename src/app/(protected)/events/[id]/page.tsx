import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { expireOverdueOrders } from "@/lib/payments/expire";
import { SeatPicker } from "./seat-picker";

// Seat availability changes every second, so build this page fresh each visit.
export const dynamic = "force-dynamic";

export default async function EventSeatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  await expireOverdueOrders();

  const event = await db.event.findUnique({
    where: { id },
    include: {
      seatLayout: {
        include: { seats: { orderBy: [{ rowIndex: "asc" }, { colIndex: "asc" }] } },
      },
    },
  });
  if (!event) notFound();

  if (!event.seatLayout) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-gray-600">This event has no assigned seats.</p>
      </section>
    );
  }

  // A seat counts as taken if it is sold, or held and the hold has not expired.
  const reservations = await db.seatReservation.findMany({
    where: {
      eventId: event.id,
      OR: [{ status: "SOLD" }, { status: "HELD", expiresAt: { gt: new Date() } }],
    },
    select: { seatId: true, userId: true },
  });

  const mySeatIds = reservations.filter((r) => r.userId === user.id).map((r) => r.seatId);
  const takenSeatIds = reservations.filter((r) => r.userId !== user.id).map((r) => r.seatId);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-gray-600">Choose your seat. A held seat is kept for 10 minutes.</p>
      <SeatPicker
        eventId={event.id}
        seats={event.seatLayout.seats.map((s) => ({
          id: s.id,
          label: s.label,
          colIndex: s.colIndex,
        }))}
        takenSeatIds={takenSeatIds}
        mySeatIds={mySeatIds}
      />
      <Link
        href={`/events/${event.id}/checkout`}
        className="inline-block rounded bg-blue-700 px-4 py-2 text-white"
      >
        Checkout
      </Link>
    </section>
  );
}
