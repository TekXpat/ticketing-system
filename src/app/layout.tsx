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
      <body className="bg-page text-ink min-h-screen antialiased">
        <header className="border-line bg-surface/95 sticky top-0 z-20 border-b backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="bg-brand inline-block h-5 w-5 rounded" aria-hidden="true" />
              {APP_NAME}
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/events" className="nav-link">
                Tickets
              </Link>
              {user ? (
                <>
                  <Link href="/tickets" className="nav-link">
                    My tickets
                  </Link>
                  {user.role === "ORGANISER" ? (
                    <>
                      <Link href="/events/new" className="nav-link">
                        Create a ticket
                      </Link>
                      <Link href="/gate" className="nav-link">
                        Gate
                      </Link>
                    </>
                  ) : null}
                  <Link href="/account" className="nav-link">
                    Account
                  </Link>
                  <form action={signOut}>
                    <button type="submit" className="btn btn-outline btn-small">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/sign-up" className="nav-link">
                    Sign up
                  </Link>
                  <Link href="/sign-in" className="btn btn-primary">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
