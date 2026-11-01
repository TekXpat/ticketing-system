import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type TicketDocument = {
  code: string;
  event: string;
  startsAt: Date;
  ticketType: string;
  seat: string | null;
  holder: string | null;
  qrPng: Uint8Array;
};

// The built-in PDF fonts only know Latin letters. Anything else becomes "?",
// so a name like "Ndayisenga" or "Éric" prints, and an emoji cannot crash it.
export function pdfSafe(value: string): string {
  return Array.from(value)
    .map((char) => {
      const code = char.codePointAt(0) ?? 63;
      return (code >= 32 && code <= 126) || (code >= 160 && code <= 255) ? char : "?";
    })
    .join("");
}

// Breaks text into lines that fit a width. A single very long word is cut.
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";

  const add = (piece: string) => {
    const next = line ? `${line} ${piece}` : piece;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
      return;
    }
    if (line) {
      lines.push(line);
      line = "";
    }
    let rest = piece;
    while (font.widthOfTextAtSize(rest, size) > maxWidth) {
      let cut = rest.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    line = rest;
  };

  for (const word of text.split(/\s+/).filter(Boolean)) add(word);
  if (line) lines.push(line);
  return lines;
}

function chunk(text: string, size: number): string[] {
  const parts: string[] = [];
  for (let index = 0; index < text.length; index += size)
    parts.push(text.slice(index, index + size));
  return parts;
}

// A one-page printable ticket as a PDF.
export async function buildTicketPdf(ticket: TicketDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 640]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const margin = 32;
  const width = 420 - margin * 2;
  const ink = rgb(0.07, 0.09, 0.15);
  const grey = rgb(0.29, 0.33, 0.4);

  page.drawRectangle({ x: 16, y: 16, width: 388, height: 608, borderColor: ink, borderWidth: 2 });

  let y = 590;
  const draw = (text: string, font: PDFFont, size: number, color = ink) => {
    for (const line of wrap(pdfSafe(text), font, size, width)) {
      page.drawText(line, { x: margin, y, size, font, color });
      y -= size + 4;
    }
  };

  const when = ticket.startsAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });

  draw(ticket.event, bold, 22);
  y -= 4;
  draw(when, regular, 12, grey);
  y -= 14;
  draw(`${ticket.ticketType}${ticket.seat ? ` - seat ${ticket.seat}` : ""}`, bold, 16);
  if (ticket.holder) draw(`Name: ${ticket.holder}`, regular, 14);
  y -= 10;

  const qr = await pdf.embedPng(ticket.qrPng);
  const qrSize = 220;
  y -= qrSize;
  page.drawImage(qr, { x: (420 - qrSize) / 2, y, width: qrSize, height: qrSize });
  y -= 24;

  for (const part of chunk(pdfSafe(ticket.code), 52)) {
    page.drawText(part, { x: margin, y, size: 9, font: mono, color: ink });
    y -= 13;
  }
  y -= 10;
  draw("Show this code at the gate. It can be used once.", regular, 10, grey);

  return pdf.save();
}
