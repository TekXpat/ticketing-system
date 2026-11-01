import { createTicketCode } from "@/lib/tickets/sign";
import { ticketQrSvg } from "@/lib/tickets/qr";
import type { MyTicket } from "@/lib/tickets/mine";

export async function TicketList({ tickets }: { tickets: MyTicket[] }) {
  if (tickets.length === 0) {
    return <p className="text-muted">You have no tickets yet.</p>;
  }

  const items = await Promise.all(
    tickets.map(async (ticket) => {
      const code = createTicketCode(ticket);
      return { ticket, code, qr: await ticketQrSvg(code) };
    }),
  );

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map(({ ticket, code, qr }) => (
        <li key={ticket.id} className="card space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-lg font-semibold">{ticket.event.title}</p>
            {ticket.usedAt ? (
              <span className="badge badge-amber">Used</span>
            ) : (
              <span className="badge badge-green">Not used yet</span>
            )}
          </div>
          {ticket.orderItem.holderName ? (
            <p className="font-medium">{ticket.orderItem.holderName}</p>
          ) : null}
          <p className="text-muted text-sm">
            {ticket.ticketType.name}
            {ticket.seat ? ` · seat ${ticket.seat.label}` : ""} ·{" "}
            {ticket.event.startsAt.toLocaleString("en-GB", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
          <div
            className="w-fit rounded-lg bg-white p-1"
            aria-label="QR code for this ticket"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="bg-surface-2 rounded-lg p-2 font-mono text-xs break-all">{code}</p>
          <a
            href={`/api/tickets/${ticket.id}/download`}
            className="text-brand-soft inline-block text-sm font-medium underline"
          >
            Download ticket (PDF)
          </a>
        </li>
      ))}
    </ul>
  );
}
