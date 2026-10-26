import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { expireOverdueOrders } from "@/lib/payments/expire";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  await expireOverdueOrders();

  const event = await db.event.findUnique({
    where: { id },
    include: { ticketTypes: { where: { seated: true }, orderBy: { price: "asc" } } },
  });
  if (!event) notFound();
  const ticketType = event.ticketTypes[0];

  const holds = await db.seatReservation.findMany({
    where: { eventId: id, userId: user.id, status: "HELD", expiresAt: { gt: new Date() } },
    include: { seat: true },
    orderBy: { seat: { label: "asc" } },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Checkout: {event.title}</h1>
      {holds.length === 0 || !ticketType ? (
        <p className="text-gray-600">
          You have no held seats.{" "}
          <Link href={`/events/${id}`} className="text-blue-700 underline">
            Choose seats
          </Link>
        </p>
      ) : (
        <>
          <ul className="space-y-1 text-sm">
            {holds.map((hold) => (
              <li key={hold.id}>
                Seat {hold.seat.label} · {ticketType.price.toLocaleString("en-GB")}
              </li>
            ))}
          </ul>
          <p className="font-medium">
            Total: {(ticketType.price * holds.length).toLocaleString("en-GB")}
          </p>
          <CheckoutForm eventId={id} />
        </>
      )}
    </section>
  );
}
