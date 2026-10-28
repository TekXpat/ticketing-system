import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import "./globals.css";

export const metadata: Metadata = { title: APP_NAME };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              {APP_NAME}
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/events">Tickets</Link>
              {user ? (
                <>
                  <Link href="/tickets">My tickets</Link>
                  {user.role === "ORGANISER" ? (
                    <>
                      <Link href="/events/new">Create a ticket</Link>
                      <Link href="/gate">Gate</Link>
                    </>
                  ) : null}
                  <Link href="/account">Account</Link>
                  <form action={signOut}>
                    <button type="submit" className="text-gray-600 hover:text-gray-900">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/sign-in">Sign in</Link>
                  <Link href="/sign-up">Sign up</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
