import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth/session";

// Example server component: reads data on the server and passes plain values
// down to a client component for the interactive part.
export default async function AccountPage() {
  const user = await requireUser();

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
    </section>
  );
}
