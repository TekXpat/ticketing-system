import { db } from "@/lib/db";
import type { SeatedKind } from "./schemas";

// Seats per row: a bus has 4, a plane 6, a theatre 10 (A to J).
const COLUMNS: Record<SeatedKind, string> = {
  bus: "ABCD",
  flight: "ABCDEF",
  theatre: "ABCDEFGHIJ",
};
const LABELS: Record<SeatedKind, string> = { bus: "Bus", flight: "Flight", theatre: "Theatre" };

export type SeatSection = { name: string; count: number };

// Seats laid out in rows: 1A 1B 1C 1D, 2A 2B ... The last row may be shorter.
export function seatGrid(columns: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    label: `${Math.floor(index / columns.length) + 1}${columns.charAt(index % columns.length)}`,
    rowIndex: Math.floor(index / columns.length),
    colIndex: index % columns.length,
  }));
}

export function busSeats(count: number) {
  return seatGrid("ABCD", count);
}

// The grid for a vehicle or hall, with each seat given the name of its section
// in order (for example the first 4 seats Business, the rest Economy).
export function seatsWithSections(kind: SeatedKind, sections: SeatSection[]) {
  const total = sections.reduce((sum, section) => sum + section.count, 0);
  const names = sections.flatMap((section) =>
    Array.from({ length: section.count }, () => section.name),
  );
  return seatGrid(COLUMNS[kind], total).map((seat, index) => ({
    ...seat,
    section: names[index] ?? "main",
  }));
}

// One layout per kind and split, created the first time it is needed and reused after.
export function layoutName(kind: SeatedKind, sections: SeatSection[]): string {
  const [only] = sections;
  if (sections.length === 1 && only?.name === "main") {
    return `${LABELS[kind]} (${only.count} seats)`;
  }
  return `${LABELS[kind]}: ${JSON.stringify(sections.map((s) => [s.name, s.count]))}`;
}

export async function ensureSeatLayout(kind: SeatedKind, sections: SeatSection[]): Promise<string> {
  const name = layoutName(kind, sections);
  const existing = await db.seatLayout.findFirst({ where: { name }, select: { id: true } });
  if (existing) return existing.id;

  const layout = await db.seatLayout.create({
    data: { name, seats: { create: seatsWithSections(kind, sections) } },
    select: { id: true },
  });
  return layout.id;
}
