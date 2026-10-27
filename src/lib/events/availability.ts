import { db } from "@/lib/db";

// How many tickets of each type can still be bought. Stock in use is paid
// orders plus unpaid orders that have not expired, the same rule createOrder uses.
export async function ticketsLeftByType(
  types: { id: string; quantity: number }[],
): Promise<Map<string, number>> {
  if (types.length === 0) return new Map();

  const taken = await db.orderItem.groupBy({
    by: ["ticketTypeId"],
    where: {
      ticketTypeId: { in: types.map((type) => type.id) },
      order: {
        OR: [{ status: "PAID" }, { status: "PENDING", expiresAt: { gt: new Date() } }],
      },
    },
    _count: { _all: true },
  });

  const takenById = new Map(taken.map((row) => [row.ticketTypeId, row._count._all]));
  return new Map(
    types.map((type) => [type.id, Math.max(0, type.quantity - (takenById.get(type.id) ?? 0))]),
  );
}
