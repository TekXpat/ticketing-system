import { describe, expect, it } from "vitest";
import { buildStats, percent } from "./stats";

const events = [
  {
    id: "e1",
    title: "Big show",
    kind: "concert",
    startsAt: new Date("2026-11-01T10:00:00Z"),
    ticketTypes: [
      { id: "vip", name: "VIP", quantity: 100 },
      { id: "reg", name: "Regular", quantity: 300 },
    ],
  },
];

describe("buildStats", () => {
  it("adds up sold, left, revenue and gate scans per event and in total", () => {
    const sales = new Map([
      ["vip", { sold: 40, revenue: 400000 }],
      ["reg", { sold: 100, revenue: 500000 }],
    ]);
    const tickets = new Map([
      ["vip", { issued: 40, scanned: 10 }],
      ["reg", { issued: 100, scanned: 0 }],
    ]);

    const { events: result, totals } = buildStats(events, sales, tickets);

    expect(result[0]).toMatchObject({
      quantity: 400,
      sold: 140,
      left: 260,
      revenue: 900000,
      issued: 140,
      scanned: 10,
    });
    expect(result[0]?.types[0]).toMatchObject({ name: "VIP", sold: 40, revenue: 400000 });
    expect(totals).toEqual({
      events: 1,
      quantity: 400,
      sold: 140,
      left: 260,
      revenue: 900000,
      issued: 140,
      scanned: 10,
    });
  });

  it("shows zeros for a ticket type nobody has bought", () => {
    const { events: result } = buildStats(events, new Map(), new Map());

    expect(result[0]).toMatchObject({ sold: 0, left: 400, revenue: 0, scanned: 0 });
  });

  it("never reports less than zero left", () => {
    const sales = new Map([["vip", { sold: 150, revenue: 0 }]]);

    const { events: result } = buildStats(events, sales, new Map());

    expect(result[0]?.left).toBe(250);
    expect(result[0]?.types[0]?.sold).toBe(150);
  });
});

describe("percent", () => {
  it("rounds, clamps and treats an empty whole as zero", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 0)).toBe(0);
    expect(percent(200, 100)).toBe(100);
    expect(percent(-5, 100)).toBe(0);
  });
});
