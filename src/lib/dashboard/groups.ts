import type { EventStats, Totals } from "./stats";

// Totals for a list of events. Only call it on events of the same kind, so that
// seats and standing places are never added together.
export function totalsOf(events: EventStats[]): Totals {
  const sum = (pick: (event: EventStats) => number) =>
    events.reduce((total, event) => total + pick(event), 0);
  return {
    events: events.length,
    quantity: sum((event) => event.quantity),
    sold: sum((event) => event.sold),
    left: sum((event) => event.left),
    revenue: sum((event) => event.revenue),
    issued: sum((event) => event.issued),
    scanned: sum((event) => event.scanned),
  };
}

export type KindGroup = { kind: string; events: EventStats[]; totals: Totals };

// Events grouped by kind (bus, concert...), each group with its own totals.
export function groupByKind(events: EventStats[]): KindGroup[] {
  const groups = new Map<string, EventStats[]>();
  for (const event of events) {
    const key = event.kind.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kind, list]) => ({ kind, events: list, totals: totalsOf(list) }));
}