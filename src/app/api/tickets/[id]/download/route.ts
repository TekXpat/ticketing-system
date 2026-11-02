import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { buildTicketPdf } from "@/lib/tickets/document";
import { ticketQrPng } from "@/lib/tickets/qr";
import { createTicketCode } from "@/lib/tickets/sign";

// Downloads one ticket as a PDF. Only the owner of a paid ticket can.
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
      orderItem: { select: { holderName: true } },
    },
  });
  if (!ticket) return new Response("Ticket not found.", { status: 404 });

  const code = createTicketCode(ticket);
  const bytes = await buildTicketPdf({
    code,
    event: ticket.event.title,
    startsAt: ticket.event.startsAt,
    ticketType: ticket.ticketType.name,
    seat: ticket.seat?.label ?? null,
    holder: ticket.orderItem.holderName,
    qrPng: await ticketQrPng(code),
  });

  // A plain ArrayBuffer is the simplest body type for Response.
  const body = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${ticket.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
