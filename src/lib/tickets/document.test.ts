import { describe, expect, it } from "vitest";
import { buildTicketPdf, pdfSafe } from "./document";
import { ticketQrPng } from "./qr";

const base = {
  code: "abc123.def456",
  event: "Big show",
  startsAt: new Date("2026-11-01T10:00:00Z"),
  ticketType: "VIP",
  seat: "2C" as string | null,
  holder: "Aline Uwase" as string | null,
};

describe("ticket pdf", () => {
  it("makes a real PDF file", async () => {
    const bytes = await buildTicketPdf({ ...base, qrPng: await ticketQrPng(base.code) });

    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("does not crash on unusual names, long titles or a missing seat", async () => {
    const bytes = await buildTicketPdf({
      ...base,
      event: "A very long event title ".repeat(10),
      seat: null,
      holder: "Éric 😀 ɛ",
      qrPng: await ticketQrPng(base.code),
    });

    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("replaces characters the PDF font cannot print", () => {
    expect(pdfSafe("Éric ɛ 😀")).toBe("Éric ? ?");
    expect(pdfSafe("Plain name")).toBe("Plain name");
  });
});
