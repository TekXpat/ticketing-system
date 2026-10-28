import { ProfileForm } from "@/components/profile-form";
import { TicketList } from "@/components/ticket-list";
import { requireUser } from "@/lib/auth/session";
import { getMyTickets } from "@/lib/tickets/mine";

export const dynamic = "force-dynamic";

// Server component: reads data on the server and passes plain values
// down to a client component for the interactive part.
export default async function AccountPage() {
  const user = await requireUser();
  const tickets = await getMyTickets(user.id);

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Your account</h1>
        <p className="text-gray-600">
          Signed in as <span data-testid="account-email">{user.email}</span>
        </p>
        <p className="text-sm text-gray-500">
          Member since {user.createdAt.toLocaleDateString("en-GB", { dateStyle: "long" })}
        </p>
      </div>

      <ProfileForm initialName={user.name ?? ""} />

      <div id="tickets" className="space-y-3">
        <h2 className="text-xl font-semibold">Your tickets</h2>
        <TicketList tickets={tickets} />
      </div>
    </section>
  );
}
