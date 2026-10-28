import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createTicketCode } from "@/lib/tickets/sign";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const user = await requireUser();

  const tickets = await db.ticket.findMany({
    where: { orderItem: { order: { userId: user.id, status: "PAID" } } },
    include: {
      event: { select: { title: true, startsAt: true } },
      ticketType: { select: { name: true } },
      seat: { select: { label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">My tickets</h1>
      {tickets.length === 0 ? (
        <p className="text-gray-600">You have no tickets yet.</p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="space-y-1 rounded border border-gray-300 p-4">
              <p className="font-semibold">{ticket.event.title}</p>
              <p className="text-sm text-gray-600">
                {ticket.ticketType.name}
                {ticket.seat ? ` · seat ${ticket.seat.label}` : ""} ·{" "}
                {ticket.event.startsAt.toLocaleString("en-GB", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
              <p className="text-sm font-medium">{ticket.usedAt ? "Used" : "Not used yet"}</p>
              <p className="rounded bg-gray-100 p-2 font-mono text-xs break-all">
                {createTicketCode(ticket)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
