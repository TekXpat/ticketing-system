import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = { title: APP_NAME };

// Runs before the page is drawn, so there is no flash of the wrong theme.
// A saved choice wins. Otherwise the device setting decides.
const themeScript = `(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (theme !== "light" && theme !== "dark") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (error) {}
})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-page text-ink min-h-screen antialiased">
        <header className="border-line bg-surface sticky top-0 z-20 border-b">
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
                    <Link href="/gate" className="nav-link">
                      Gate
                    </Link>
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
                  <Link href="/sign-in" className="btn btn-primary btn-small">
                    Sign in
                  </Link>
                </>
              )}
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
