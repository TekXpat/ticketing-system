import { db } from "@/lib/db";

export type TypeStats = {
  id: string;
  name: string;
  quantity: number;
  sold: number;
  revenue: number;
  issued: number;
  scanned: number;
};

export type EventStats = {
  id: string;
  title: string;
  kind: string;
  startsAt: Date;
  quantity: number;
  sold: number;
  left: number;
  revenue: number;
  issued: number;
  scanned: number;
  types: TypeStats[];
};

export type Totals = {
  events: number;
  quantity: number;
  sold: number;
  left: number;
  revenue: number;
  issued: number;
  scanned: number;
};

type EventInput = {
  id: string;
  title: string;
  kind: string;
  startsAt: Date;
  ticketTypes: { id: string; name: string; quantity: number }[];
};
type SalesByType = Map<string, { sold: number; revenue: number }>;
type TicketsByType = Map<string, { issued: number; scanned: number }>;

// A share of a whole as a whole number from 0 to 100. An empty whole is 0.
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

// Pure arithmetic, so it can be tested without a database.
export function buildStats(
  events: EventInput[],
  sales: SalesByType,
  tickets: TicketsByType,
): { events: EventStats[]; totals: Totals } {
  const stats: EventStats[] = events.map((event) => {
    const types: TypeStats[] = event.ticketTypes.map((type) => {
      const sale = sales.get(type.id);
      const issued = tickets.get(type.id);
      return {
        id: type.id,
        name: type.name,
        quantity: type.quantity,
        sold: sale?.sold ?? 0,
        revenue: sale?.revenue ?? 0,
        issued: issued?.issued ?? 0,
        scanned: issued?.scanned ?? 0,
      };
    });
    const sum = (pick: (type: TypeStats) => number) =>
      types.reduce((total, type) => total + pick(type), 0);
    const quantity = sum((type) => type.quantity);
    const sold = sum((type) => type.sold);

    return {
      id: event.id,
      title: event.title,
      kind: event.kind,
      startsAt: event.startsAt,
      quantity,
      sold,
      left: Math.max(0, quantity - sold),
      revenue: sum((type) => type.revenue),
      issued: sum((type) => type.issued),
      scanned: sum((type) => type.scanned),
      types,
    };
  });

  const total = (pick: (event: EventStats) => number) =>
    stats.reduce((sum, event) => sum + pick(event), 0);

  return {
    events: stats,
    totals: {
      events: stats.length,
      quantity: total((event) => event.quantity),
      sold: total((event) => event.sold),
      left: total((event) => event.left),
      revenue: total((event) => event.revenue),
      issued: total((event) => event.issued),
      scanned: total((event) => event.scanned),
    },
  };
}

// The dashboard numbers for one organiser's events. "Sold" and revenue count
// only paid orders, so unpaid or failed orders never inflate them.
export async function getOrganiserStats(organiserId: string) {
  const events = await db.event.findMany({
    where: { organiserId },
    orderBy: { startsAt: "asc" },
    include: {
      ticketTypes: {
        orderBy: { price: "desc" },
        select: { id: true, name: true, quantity: true },
      },
    },
  });

  const typeIds = events.flatMap((event) => event.ticketTypes.map((type) => type.id));
  if (typeIds.length === 0) return buildStats(events, new Map(), new Map());

  const [paid, issued, scanned] = await Promise.all([
    db.orderItem.groupBy({
      by: ["ticketTypeId"],
      where: { ticketTypeId: { in: typeIds }, order: { status: "PAID" } },
      _count: { _all: true },
      _sum: { price: true },
    }),
    db.ticket.groupBy({
      by: ["ticketTypeId"],
      where: { ticketTypeId: { in: typeIds } },
      _count: { _all: true },
    }),
    db.ticket.groupBy({
      by: ["ticketTypeId"],
      where: { ticketTypeId: { in: typeIds }, usedAt: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const sales: SalesByType = new Map(
    paid.map((row) => [row.ticketTypeId, { sold: row._count._all, revenue: row._sum.price ?? 0 }]),
  );
  const scannedById = new Map(scanned.map((row) => [row.ticketTypeId, row._count._all]));
  const tickets: TicketsByType = new Map(
    issued.map((row) => [
      row.ticketTypeId,
      { issued: row._count._all, scanned: scannedById.get(row.ticketTypeId) ?? 0 },
    ]),
  );

  return buildStats(events, sales, tickets);
}
