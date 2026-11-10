import { describe, expect, it } from "vitest";
import { groupByKind, totalsOf } from "./groups";
import type { EventStats } from "./stats";

const event = (id: string, kind: string, sold: number, quantity: number, revenue: number) =>
  ({
    id,
    title: id,
    kind,
    startsAt: new Date("2026-11-01T10:00:00Z"),
    quantity,
    sold,
    left: quantity - sold,
    revenue,
    issued: sold,
    scanned: 0,
    types: [],
  }) satisfies EventStats;

describe("dashboard groups", () => {
  it("keeps buses and concerts apart instead of adding them together", () => {
    const groups = groupByKind([
      event("bus1", "bus", 10, 20, 50000),
      event("bus2", "Bus ", 5, 20, 25000),
      event("show", "concert", 100, 1000, 3000000),
    ]);

    expect(groups.map((group) => group.kind)).toEqual(["bus", "concert"]);
    expect(groups[0]?.totals).toMatchObject({ events: 2, sold: 15, left: 25, revenue: 75000 });
    expect(groups[1]?.totals).toMatchObject({ events: 1, sold: 100, left: 900 });
  });

  it("adds up the events of one group", () => {
    const totals = totalsOf([event("a", "bus", 3, 10, 300), event("b", "bus", 2, 10, 200)]);

    expect(totals).toMatchObject({ events: 2, quantity: 20, sold: 5, left: 15, revenue: 500 });
  });

  it("returns no groups when there are no events", () => {
    expect(groupByKind([])).toEqual([]);
  });
});
