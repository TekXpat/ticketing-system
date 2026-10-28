export type TicketDocument = {
  code: string;
  event: string;
  startsAt: Date;
  ticketType: string;
  seat: string | null;
};

// Event titles are typed by organisers, so never put them in HTML unescaped.
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// A standalone, printable ticket. Open it and print it, or save it as PDF.
export function buildTicketHtml(ticket: TicketDocument): string {
  const when = ticket.startsAt.toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Ticket: ${escapeHtml(ticket.event)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f3f4f6; }
  .ticket { max-width: 480px; margin: 0 auto; background: #fff; border: 2px solid #111827; border-radius: 12px; padding: 24px; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  p { margin: 4px 0; color: #374151; }
  .type { font-size: 18px; font-weight: 600; margin-top: 16px; color: #111827; }
  .code { margin-top: 20px; padding: 12px; background: #f3f4f6; border-radius: 8px; font-family: ui-monospace, monospace; font-size: 12px; word-break: break-all; }
  .note { margin-top: 12px; font-size: 12px; color: #6b7280; }
</style>
</head>
<body>
<div class="ticket">
  <h1>${escapeHtml(ticket.event)}</h1>
  <p>${escapeHtml(when)}</p>
  <p class="type">${escapeHtml(ticket.ticketType)}${ticket.seat ? ` · seat ${escapeHtml(ticket.seat)}` : ""}</p>
  <div class="code">${escapeHtml(ticket.code)}</div>
  <p class="note">Show this code at the gate. It can be used once.</p>
</div>
</body>
</html>
`;
}
