import { db } from "@/lib/db";
import { isGenuineTicketCode, parseTicketCode } from "./sign";

type TicketDetails = { ticketType: string; seat: string | null; event: string };

export type VerifyResult =
  | { status: "invalid" }
  | ({ status: "valid" } & TicketDetails)
  | ({ status: "already_used"; usedAt: string } & TicketDetails);

// Checks a ticket code at the gate and marks the ticket as used.
// The type and seat shown come from the database row, which is also what the
// signature covers, so a holder cannot present a standard ticket as VIP.
export async function verifyAndUseTicket(code: string): Promise<VerifyResult> {
  const parsed = parseTicketCode(code);
  if (!parsed) return { status: "invalid" };

  const ticket = await db.ticket.findUnique({
    where: { id: parsed.ticketId },
    include: {
      ticketType: { select: { name: true } },
      seat: { select: { label: true } },
      event: { select: { title: true } },
    },
  });
  // An unknown id and a forged signature give the same answer on purpose.
  if (!ticket) return { status: "invalid" };
  if (!isGenuineTicketCode(code, ticket)) return { status: "invalid" };

  const details: TicketDetails = {
    ticketType: ticket.ticketType.name,
    seat: ticket.seat?.label ?? null,
    event: ticket.event.title,
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
