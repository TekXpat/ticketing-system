import { db } from "@/lib/db";
import { gateForKind, type Gate } from "./gates";
import { isGenuineTicketCode, parseTicketCode } from "./sign";

type TicketDetails = {
  ticketType: string;
  seat: string | null;
  event: string;
  holder: string | null;
};

export type VerifyResult =
  | { status: "invalid" }
  | { status: "wrong_gate"; ticketGate: string; gate: string }
  | { status: "wrong_event"; ticketEvent: string }
  | ({ status: "valid" } & TicketDetails)
  | ({ status: "already_used"; usedAt: string } & TicketDetails);

// Checks a ticket code at one gate, for one event, and marks the ticket as used.
// The type, seat and name shown come from the database row, so a holder cannot
// present a standard ticket as VIP or change the name.
export async function verifyAndUseTicket(
  code: string,
  gate: Gate,
  eventId: string,
): Promise<VerifyResult> {
  const parsed = parseTicketCode(code);
  if (!parsed) return { status: "invalid" };

  const ticket = await db.ticket.findUnique({
    where: { id: parsed.ticketId },
    include: {
      ticketType: { select: { name: true } },
      seat: { select: { label: true } },
      event: { select: { title: true, kind: true } },
      orderItem: { select: { holderName: true } },
    },
  });
  // An unknown id and a forged signature give the same answer on purpose.
  if (!ticket) return { status: "invalid" };
  if (!isGenuineTicketCode(code, ticket)) return { status: "invalid" };

  // Wrong category or wrong event: refuse BEFORE touching the ticket, so it
  // stays unused and can still be scanned at the right place.
  const ticketGate = gateForKind(ticket.event.kind);
  if (ticketGate?.slug !== gate.slug) {
    return {
      status: "wrong_gate",
      ticketGate: ticketGate?.label ?? ticket.event.kind,
      gate: gate.label,
    };
  }
  if (ticket.eventId !== eventId) {
    return { status: "wrong_event", ticketEvent: ticket.event.title };
  }

  const details: TicketDetails = {
    ticketType: ticket.ticketType.name,
    seat: ticket.seat?.label ?? null,
    event: ticket.event.title,
    holder: ticket.orderItem.holderName,
  };

  // Only one scan can move used_at from NULL to a time. The others change nothing.
  const claimed = await db.ticket.updateMany({
    where: { id: ticket.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 1) return { status: "valid", ...details };

  const current = await db.ticket.findUnique({
    where: { id: ticket.id },
    select: { usedAt: true },
  });
  return {
    status: "already_used",
    usedAt: (current?.usedAt ?? new Date()).toISOString(),
    ...details,
  };
}