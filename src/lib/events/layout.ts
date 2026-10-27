import { db } from "@/lib/db";

// Bus seats are laid out four to a row: 1A 1B 1C 1D, 2A 2B ...
// The last row is shorter when the count is not a multiple of four.
export function busSeats(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    label: `${Math.floor(index / 4) + 1}${"ABCD".charAt(index % 4)}`,
    rowIndex: Math.floor(index / 4),
    colIndex: index % 4,
  }));
}

// One layout per seat count, created the first time it is needed and reused after.
export async function ensureBusLayout(seatCount: number): Promise<string> {
  const name = `Bus (${seatCount} seats)`;
  const existing = await db.seatLayout.findFirst({ where: { name }, select: { id: true } });
  if (existing) return existing.id;

  const layout = await db.seatLayout.create({
    data: { name, seats: { create: busSeats(seatCount) } },
    select: { id: true },
  });
  return layout.id;
}
