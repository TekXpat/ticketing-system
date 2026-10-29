import { ProfileForm } from "@/components/profile-form";
import { TicketList } from "@/components/ticket-list";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { getMyTickets } from "@/lib/tickets/mine";

export const dynamic = "force-dynamic";

// Server component: reads data on the server and passes plain values
// down to a client component for the interactive part.
export default async function AccountPage() {
  const user = await requireUser();
  const tickets = await getMyTickets(user.id);

  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Your account</h1>

        <div className="card max-w-sm space-y-1">
          <p className="text-muted text-sm">Signed in as</p>
          <p className="font-semibold" data-testid="account-email">
            {user.email}
          </p>
          <p className="text-muted text-sm">
            Member since {user.createdAt.toLocaleDateString("en-GB", { dateStyle: "long" })}
          </p>
        </div>

        <ProfileForm initialName={user.name ?? ""} />

        <form action={signOut}>
          <button type="submit" className="btn btn-outline">
            Sign out
          </button>
        </form>
      </div>

      <div id="tickets" className="space-y-4">
        <h2 className="text-2xl font-semibold">My tickets</h2>
        <TicketList tickets={tickets} />
      </div>
    </section>
  );
}
