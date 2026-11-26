import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { NavBar } from "@/components/nav-bar";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

export const metadata: Metadata = { title: "Tikets" };

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
  const isOrganiser = user?.role === "ORGANISER";
  const canUseGate = isOrganiser || user?.role === "STAFF";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>

      <body className="bg-page text-ink min-h-screen antialiased">
        <SplashScreen />

        <header className="border-line bg-surface sticky top-0 z-20 border-b">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="bg-brand inline-block h-5 w-5 rounded" aria-hidden="true" />
              Tikets
            </Link>

            <NavBar
              user={
                user
                  ? {
                      id: user.id,
                      name: user.name ?? null,
                      email: user.email,
                      role: user.role,
                    }
                  : null
              }
              isOrganiser={isOrganiser}
              canUseGate={canUseGate}
            />
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
