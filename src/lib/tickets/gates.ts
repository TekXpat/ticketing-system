// Each event category has its own gate. The gate is decided by the event's kind.
export const GATES = [
  { slug: "buses", kind: "bus", label: "Buses" },
  { slug: "concerts", kind: "concert", label: "Concerts" },
  { slug: "conferences", kind: "conference", label: "Conferences" },
  { slug: "flights", kind: "flight", label: "Flights" },
  { slug: "theatres", kind: "theatre", label: "Theatres" },
] as const;

export type Gate = (typeof GATES)[number];

export function findGate(slug: string): Gate | undefined {
  return GATES.find((gate) => gate.slug === slug);
}

// The gate a ticket belongs to, from its event's kind. Case and spaces are ignored.
export function gateForKind(kind: string): Gate | undefined {
  const normal = kind.trim().toLowerCase();
  return GATES.find((gate) => gate.kind === normal);
}
