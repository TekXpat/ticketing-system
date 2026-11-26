import Link from "next/link";
import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cancelOrder } from "@/lib/orders/cancel";
import { expireOverdueOrders } from "@/lib/payments/expire";

const Simulator = nextDynamic(() => import("./simulator").then((m) => m.Simulator));

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  PAID: "badge badge-green",
  CONFIRMED: "badge badge-green",
  PENDING: "badge badge-amber",
  FAILED: "badge badge-red",
  EXPIRED: "badge badge-red",
  TIMED_OUT: "badge badge-red",
};

function StatusBadge({ status }: { status: string }) {
  return <span className={STATUS_BADGE[status] ?? "badge badge-blue"}>{status}</span>;
}

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
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Order for {order.event.title}</h1>

      <div className="card space-y-3">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          Order <StatusBadge status={order.status} />
          {order.payment ? (
            <>
              Payment <StatusBadge status={order.payment.status} />
            </>
          ) : null}
        </p>
        <p className="text-lg font-semibold">
          Amount: {order.payment?.amount.toLocaleString("en-GB")}
        </p>
        <ul className="border-line space-y-1 border-t pt-3 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-wrap justify-between gap-2">
              <span>
                {item.ticketType.name}
                {item.seat ? ` · seat ${item.seat.label}` : ""}
                {item.holderName ? ` · ${item.holderName}` : ""}
              </span>
              {item.ticket ? <span className="badge badge-green">Ticket issued</span> : null}
            </li>
          ))}
        </ul>
      </div>

      {order.status === "PENDING" ? (
        <div className="card space-y-4">
          <p className="text-muted text-sm">
            Pay before {order.expiresAt.toLocaleTimeString("en-GB", { timeStyle: "short" })}, or the
            seats are released.
          </p>
          <Simulator orderId={order.id} />
          <form action={cancelOrder}>
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className="btn btn-danger">
              Cancel this order
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          <Link href={`/events/${order.eventId}`} className="nav-link">
            ← Back to the event
          </Link>
          {order.status === "PAID" ? (
            <Link href="/account#tickets" className="nav-link">
              View my tickets
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
