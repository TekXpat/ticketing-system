import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth/session";

const CATEGORIES = [
  { href: "/events?kind=bus", label: "Buses" },
  { href: "/events?kind=concert", label: "Concerts" },
  { href: "/events?kind=conference", label: "Conferences" },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <section className="space-y-8">
      <div className="card space-y-4 p-8">
        <h1 className="text-3xl font-bold">{APP_NAME}</h1>
        <p className="text-muted max-w-xl">
          Find a bus, a concert or a conference. Pick your seat or your tickets, pay with mobile
          money, and show your code at the gate.
        </p>
        {user ? (
          <p>
            Signed in as {user.email}.{" "}
            <Link href="/account" className="text-brand-soft underline">
              Go to your account
            </Link>
          </p>
        ) : (
          <p>
            <Link href="/sign-in" className="text-brand-soft underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/sign-up" className="text-brand-soft underline">
              create an account
            </Link>
            .
          </p>
        )}
        <div>
          <Link href="/events" className="btn btn-primary">
            Browse tickets
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Browse by kind</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Link key={category.href} href={category.href} className="chip">
              {category.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
