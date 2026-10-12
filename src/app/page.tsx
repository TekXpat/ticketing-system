import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">{APP_NAME}</h1>
      {user ? (
        <p>
          Signed in as {user.email}.{" "}
          <Link href="/account" className="text-blue-600 underline">
            Go to your account
          </Link>
        </p>
      ) : (
        <p>
          <Link href="/sign-in" className="text-blue-600 underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/sign-up" className="text-blue-600 underline">
            create an account
          </Link>
          .
        </p>
      )}
    </section>
  );
}
