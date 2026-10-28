import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { buildTicketHtml } from "@/lib/tickets/document";
import { createTicketCode } from "@/lib/tickets/sign";

// Downloads one ticket as a printable file. Only the owner of a paid ticket can.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });

  const { id } = await params;
  const ticket = await db.ticket.findFirst({
    where: { id, orderItem: { order: { userId: user.id, status: "PAID" } } },
    include: {
      event: { select: { title: true, startsAt: true } },
      ticketType: { select: { name: true } },
      seat: { select: { label: true } },
    },
  });
  if (!ticket) return new Response("Ticket not found.", { status: 404 });

  const html = buildTicketHtml({
    code: createTicketCode(ticket),
    event: ticket.event.title,
    startsAt: ticket.event.startsAt,
    ticketType: ticket.ticketType.name,
    seat: ticket.seat?.label ?? null,
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="ticket-${ticket.id}.html"`,
      "Cache-Control": "no-store",
    },
  });
}
