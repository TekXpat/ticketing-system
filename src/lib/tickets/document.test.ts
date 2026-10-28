import { describe, expect, it } from "vitest";
import { buildTicketHtml, escapeHtml } from "./document";

describe("ticket document", () => {
  it("escapes HTML in organiser-typed text", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("shows the event, type, seat and code, without raw markup from the title", () => {
    const html = buildTicketHtml({
      code: "abc.def",
      event: "<b>Big show</b>",
      startsAt: new Date("2026-11-01T10:00:00Z"),
      ticketType: "VIP",
      seat: "2C",
    });

    expect(html).toContain("&lt;b&gt;Big show&lt;/b&gt;");
    expect(html).not.toContain("<b>Big show</b>");
    expect(html).toContain("VIP · seat 2C");
    expect(html).toContain("abc.def");
  });
});
