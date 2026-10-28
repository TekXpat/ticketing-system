import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { ticketsLeftByType } from "@/lib/events/availability";
import { expireOverdueOrders } from "@/lib/payments/expire";
import { QuantityForm } from "./quantity-form";
import { SeatPicker } from "./seat-picker";

// Availability changes every second, so build this page fresh each visit.
export const dynamic = "force-dynamic";

const MAX_PER_ORDER = 20;

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  await expireOverdueOrders();

  const event = await db.event.findUnique({
    where: { id },
    include: {
      ticketTypes: { orderBy: { price: "desc" } },
      seatLayout: {
        include: { seats: { orderBy: [{ rowIndex: "asc" }, { colIndex: "asc" }] } },
      },
    },
  });
  if (!event) notFound();

  const backLink = (
    <Link href="/events" className="text-sm text-blue-700 underline">
      ← Back to tickets
    </Link>
  );

  // Standing events: choose a quantity per ticket type.
  if (!event.seatLayout) {
    const standing = event.ticketTypes.filter((type) => !type.seated);
    const left = await ticketsLeftByType(standing);

    return (
      <section className="space-y-6">
        {backLink}
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-gray-600">Choose how many tickets of each type you want.</p>
        <QuantityForm
          eventId={event.id}
          types={standing.map((type) => {
            const remaining = left.get(type.id) ?? 0;
            return {
              id: type.id,
              name: type.name,
              price: type.price,
              left: remaining,
              max: Math.min(remaining, type.maxPerCustomer ?? MAX_PER_ORDER, MAX_PER_ORDER),
            };
          })}
        />
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
      {backLink}
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
