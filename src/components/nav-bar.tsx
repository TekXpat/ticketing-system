"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut } from "@/lib/auth/actions";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type Props = {
  user: User | null;
  isOrganiser: boolean;
  canUseGate: boolean;
};

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={
        active
          ? "bg-brand rounded-md px-4 py-1.5 text-sm font-medium text-white"
          : "text-muted hover:text-ink rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
      }
    >
      {label}
    </Link>
  );
}

function initials(name: string | null, email: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email[0] ?? "?").toUpperCase();
}

function ThemeToggleInline() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  function apply(next: "dark" | "light") {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <div className="border-line space-y-2 border-t px-4 py-3">
      <p className="text-muted text-xs font-medium">Appearance</p>
      <div className="bg-surface-2 flex rounded-lg p-1">
        <button
          type="button"
          onClick={() => apply("dark")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            theme === "dark" ? "bg-brand text-white" : "text-muted hover:text-ink"
          }`}
        >
          Dark
        </button>
        <button
          type="button"
          onClick={() => apply("light")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            theme === "light" ? "bg-brand text-white" : "text-muted hover:text-ink"
          }`}
        >
          Light
        </button>
      </div>
    </div>
  );
}

export function NavBar({ user, isOrganiser, canUseGate }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex items-center">
      {/* Nav links */}
      <div className="flex items-center">
        <NavLink href="/events" label="Tickets" />
        {user && isOrganiser && <NavLink href="/dashboard" label="Dashboard" />}
        {user && canUseGate && <NavLink href="/gate" label="Gate" />}
        {user && <NavLink href="/account" label="Account" />}

        {!user && (
          <>
            <NavLink href="/sign-up" label="Sign up" />
            <Link href="/sign-in" className="btn btn-primary btn-small ml-2">
              Sign in
            </Link>
          </>
        )}
      </div>

      {/* Profile — separated with a clear gap */}
      {user && (
        <div className="relative ml-6" ref={ref}>
          {/* Hidden sign-out for e2e tests */}
          <form action={signOut} className="sr-only">
            <button type="submit">Sign out</button>
          </form>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="border-line flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-white/5"
          >
            <span className="bg-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
              {initials(user.name, user.email)}
            </span>
            <span className="max-w-[120px] truncate font-medium">
              {user.name ?? user.email.split("@")[0]}
            </span>
          </button>

          {open && (
            <div className="border-line bg-surface absolute top-full right-0 z-30 mt-2 w-64 rounded-xl border shadow-lg">
              <div className="border-line border-b px-4 py-3">
                <p className="font-semibold">{user.name ?? user.email.split("@")[0]}</p>
                <p className="text-muted truncate text-xs">{user.email}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="hover:bg-brand/10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  My Account
                </Link>
              </div>
              <ThemeToggleInline />
              <div className="p-1">
                <form
                  action={async () => {
                    setOpen(false);
                    await signOut();
                  }}
                >
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
