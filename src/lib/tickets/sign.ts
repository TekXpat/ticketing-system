import { createHmac, timingSafeEqual } from "node:crypto";

export type SignableTicket = {
  id: string;
  ticketTypeId: string;
  seatId: string | null;
};

// The signature covers the ticket's id, its type and its seat. Change any of
// them in the database and every code issued before no longer verifies.
function sign(ticket: SignableTicket, secret: string) {
  return createHmac("sha256", secret)
    .update(`${ticket.id}.${ticket.ticketTypeId}.${ticket.seatId ?? ""}`)
    .digest("base64url");
}

// The code a customer sees and the gate types in: "<ticketId>.<signature>".
export function createTicketCode(
  ticket: SignableTicket,
  secret = process.env.TICKET_SIGNING_SECRET,
): string {
  if (!secret) throw new Error("TICKET_SIGNING_SECRET is not set.");
  return `${ticket.id}.${sign(ticket, secret)}`;
}

// Splits a code into its parts without trusting it. Null when malformed.
export function parseTicketCode(code: string): { ticketId: string; signature: string } | null {
  const parts = code.trim().split(".");
  const [ticketId, signature] = parts;
  if (parts.length !== 2 || !ticketId || !signature) return null;
  return { ticketId, signature };
}

// True only if the signature matches what we would sign for this ticket row.
// A missing secret refuses everything.
export function isGenuineTicketCode(
  code: string,
  ticket: SignableTicket,
  secret = process.env.TICKET_SIGNING_SECRET,
): boolean {
  if (!secret) return false;
  const parsed = parseTicketCode(code);
  if (!parsed || parsed.ticketId !== ticket.id) return false;
  const provided = Buffer.from(parsed.signature);
  const expected = Buffer.from(sign(ticket, secret));
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
