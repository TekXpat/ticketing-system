import { describe, expect, it } from "vitest";
import { createTicketCode, isGenuineTicketCode, parseTicketCode } from "./sign";

const SECRET = "test-signing-secret";
const standard = { id: "t1", ticketTypeId: "standard", seatId: "seat-1A" };

describe("ticket codes", () => {
  it("accepts a genuine code for the ticket it was made for", () => {
    const code = createTicketCode(standard, SECRET);
    expect(isGenuineTicketCode(code, standard, SECRET)).toBe(true);
  });

  it("rejects a code signed with a different secret (forgery)", () => {
    const forged = createTicketCode(standard, "attacker-guess");
    expect(isGenuineTicketCode(forged, standard, SECRET)).toBe(false);
  });

  it("rejects a standard ticket presented as VIP", () => {
    const code = createTicketCode(standard, SECRET);
    const asVip = { ...standard, ticketTypeId: "vip" };
    expect(isGenuineTicketCode(code, asVip, SECRET)).toBe(false);
  });

  it("rejects a ticket presented for a different seat", () => {
    const code = createTicketCode(standard, SECRET);
    const otherSeat = { ...standard, seatId: "seat-5D" };
    expect(isGenuineTicketCode(code, otherSeat, SECRET)).toBe(false);
  });

  it("rejects a code whose id was swapped for another ticket", () => {
    const code = createTicketCode(standard, SECRET);
    const signature = code.split(".")[1];
    const other = { id: "t2", ticketTypeId: "standard", seatId: "seat-2B" };
    expect(isGenuineTicketCode(`t2.${signature}`, other, SECRET)).toBe(false);
  });

  it("rejects malformed codes", () => {
    expect(parseTicketCode("")).toBeNull();
    expect(parseTicketCode("only-one-part")).toBeNull();
    expect(parseTicketCode("a.b.c")).toBeNull();
    expect(isGenuineTicketCode("garbage", standard, SECRET)).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    const code = createTicketCode(standard, SECRET);
    expect(isGenuineTicketCode(code, standard, "")).toBe(false);
    expect(() => createTicketCode(standard, "")).toThrow();
  });

  it("signs tickets without a seat", () => {
    const standing = { id: "t3", ticketTypeId: "standard", seatId: null };
    const code = createTicketCode(standing, SECRET);
    expect(isGenuineTicketCode(code, standing, SECRET)).toBe(true);
  });
});
