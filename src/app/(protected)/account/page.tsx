import nextDynamic from "next/dynamic";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { getMyTickets } from "@/lib/tickets/mine";

const ExpandDetails = nextDynamic(() =>
  import("@/components/expand-details").then((m) => m.ExpandDetails),
);

const TicketList = nextDynamic(() => import("@/components/ticket-list").then((m) => m.TicketList));

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const tickets = await getMyTickets(user.id);

  return (
    <section className="max-w-2xl space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-muted text-sm">Manage your profile and view your tickets.</p>
      </div>

      <p className="sr-only" data-testid="account-email">
        {user.email}
      </p>

      <ExpandDetails
        email={user.email}
        createdAt={user.createdAt.toLocaleDateString("en-GB", { dateStyle: "long" })}
        initialName={user.name ?? ""}
      />

      <form action={signOut}>
        <button type="submit" className="btn btn-outline">
          Sign out
        </button>
      </form>

      <div id="tickets" className="space-y-4">
        <h2 className="text-xl font-semibold">My Tickets</h2>
        <TicketList tickets={tickets} />
      </div>
    </section>
  );
}
