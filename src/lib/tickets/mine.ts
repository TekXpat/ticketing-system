import { db } from "@/lib/db";

// The tickets of one user: only those from paid orders, newest first.
export async function getMyTickets(userId: string) {
  return db.ticket.findMany({
    where: { orderItem: { order: { userId, status: "PAID" } } },
    include: {
      event: { select: { title: true, startsAt: true } },
      ticketType: { select: { name: true } },
      seat: { select: { label: true } },
      orderItem: { select: { holderName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type MyTicket = Awaited<ReturnType<typeof getMyTickets>>[number];
