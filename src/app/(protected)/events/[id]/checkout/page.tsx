import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { expireOverdueOrders } from "@/lib/payments/expire";
import { cancelHolds } from "@/lib/seats/actions";
import { myUnpaidOrders, seatsReadyToCheckOut } from "@/lib/seats/mine";
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

  const holds = await seatsReadyToCheckOut(user.id, id);
  const unpaid = await myUnpaidOrders(user.id, id);

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <Link href={`/events/${id}`} className="nav-link">
        ← Back to seats
      </Link>
      <h1 className="text-3xl font-bold">Checkout: {event.title}</h1>

      {unpaid.length > 0 ? (
        <div className="alert-warning space-y-1">
          <p className="font-medium">You already have an unpaid order for this event.</p>
          {unpaid.map((order) => (
            <p key={order.id}>
              <Link href={`/orders/${order.id}`} className="font-medium underline">
                Pay or cancel it
              </Link>{" "}
              (until {order.expiresAt.toLocaleTimeString("en-GB", { timeStyle: "short" })})
            </p>
          ))}
        </div>
      ) : null}

      {holds.length === 0 || !ticketType ? (
        <p className="text-muted">
          You have no new held seats.{" "}
          <Link href={`/events/${id}`} className="text-brand-soft font-medium underline">
            Choose seats
          </Link>
        </p>
      ) : (
        <div className="card space-y-4">
          <ul className="space-y-1 text-sm">
            {holds.map((hold) => (
              <li key={hold.id} className="flex justify-between gap-3">
                <span className="font-medium">Seat {hold.seat.label}</span>
                <span className="text-muted">{ticketType.price.toLocaleString("en-GB")}</span>
              </li>
            ))}
          </ul>
          <p className="border-line border-t pt-3 text-lg font-semibold">
            Total: {(ticketType.price * holds.length).toLocaleString("en-GB")}
          </p>
          <CheckoutForm
            eventId={id}
            seats={holds.map((hold) => ({ seatId: hold.seatId, label: hold.seat.label }))}
          />
          <form action={cancelHolds}>
            <input type="hidden" name="eventId" value={id} />
            <button type="submit" className="btn btn-danger">
              Cancel and release my new seats
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
