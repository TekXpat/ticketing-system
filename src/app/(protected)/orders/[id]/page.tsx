import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cancelOrder } from "@/lib/orders/cancel";
import { expireOverdueOrders } from "@/lib/payments/expire";
import { Simulator } from "./simulator";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  await expireOverdueOrders();

  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: {
      event: true,
      payment: true,
      items: { include: { seat: true, ticketType: true, ticket: true } },
    },
  });
  if (!order) notFound();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Order for {order.event.title}</h1>
      <p>
        Order: <strong>{order.status}</strong> · Payment: <strong>{order.payment?.status}</strong> ·
        Amount: {order.payment?.amount.toLocaleString("en-GB")}
      </p>
      <ul className="space-y-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.ticketType.name}
            {item.seat ? ` · seat ${item.seat.label}` : ""}
            {item.ticket ? " · ticket issued" : ""}
          </li>
        ))}
      </ul>
      {order.status === "PENDING" ? (
        <>
          <p className="text-sm text-gray-600">
            Pay before {order.expiresAt.toLocaleTimeString("en-GB", { timeStyle: "short" })}, or the
            seats are released.
          </p>
          <Simulator orderId={order.id} />
          <form action={cancelOrder}>
            <input type="hidden" name="orderId" value={order.id} />
            <button
              type="submit"
              className="rounded border border-red-600 px-3 py-2 text-sm text-red-700"
            >
              Cancel this order
            </button>
          </form>
        </>
      ) : (
        <Link href={`/events/${order.eventId}`} className="text-sm text-blue-700 underline">
          ← Back to the event
        </Link>
      )}
    </section>
  );
}
