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

  const header = (
    <div className="space-y-2">
      <Link href="/events" className="nav-link">
        ← Back to tickets
      </Link>
      <h1 className="text-3xl font-bold">{event.title}</h1>
      <p className="text-muted text-sm">
        {event.kind}
        {event.location ? ` · ${event.location}` : ""} ·{" "}
        {event.startsAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
      </p>
    </div>
  );

  // Standing events: choose a quantity per ticket type.
  if (!event.seatLayout) {
    const standing = event.ticketTypes.filter((type) => !type.seated);
    const left = await ticketsLeftByType(standing);

    return (
      <section className="space-y-6">
        {header}
        <p className="text-muted">Choose how many tickets of each type you want.</p>
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

  // Each seated ticket type sells the seats of its section.
  const sections = event.ticketTypes
    .filter((type) => type.seated)
    .map((type) => ({ key: type.section ?? "main", name: type.name, price: type.price }));

  return (
    <section className="space-y-6">
      {header}
      <p className="text-muted">Choose your seat. A held seat is kept for 10 minutes.</p>
      <div className="card space-y-4">
        <SeatPicker
          eventId={event.id}
          seats={event.seatLayout.seats.map((s) => ({
            id: s.id,
            label: s.label,
            colIndex: s.colIndex,
            section: s.section,
          }))}
          sections={sections}
          takenSeatIds={takenSeatIds}
          mySeatIds={mySeatIds}
        />
        <Link href={`/events/${event.id}/checkout`} className="btn btn-primary">
          Checkout
        </Link>
      </div>
    </section>
  );
}
