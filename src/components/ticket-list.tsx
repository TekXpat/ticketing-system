import { createTicketCode } from "@/lib/tickets/sign";
import type { MyTicket } from "@/lib/tickets/mine";

export function TicketList({ tickets }: { tickets: MyTicket[] }) {
  if (tickets.length === 0) {
    return <p className="text-gray-600">You have no tickets yet.</p>;
  }

  return (
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
          <a
            href={`/api/tickets/${ticket.id}/download`}
            className="inline-block text-sm text-blue-700 underline"
          >
            Download ticket
          </a>
        </li>
      ))}
    </ul>
  );
}
