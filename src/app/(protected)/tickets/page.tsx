import { TicketList } from "@/components/ticket-list";
import { requireUser } from "@/lib/auth/session";
import { getMyTickets } from "@/lib/tickets/mine";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const user = await requireUser();
  const tickets = await getMyTickets(user.id);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">My tickets</h1>
      <TicketList tickets={tickets} />
    </section>
  );
}
