"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "./theme-toggle";
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
          ? "bg-brand rounded-md px-3 py-1.5 text-sm font-medium text-white"
          : "nav-link text-sm"
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
    <div className="flex flex-wrap items-center gap-3">
      <NavLink href="/events" label="Tickets" />
      {user && isOrganiser && <NavLink href="/dashboard" label="Dashboard" />}
      {user && canUseGate && <NavLink href="/gate" label="Gate" />}
      {user && <NavLink href="/account" label="Account" />}

      {!user && (
        <>
          <Link href="/sign-up" className="nav-link text-sm">
            Sign up
          </Link>
          <Link href="/sign-in" className="btn btn-primary btn-small">
            Sign in
          </Link>
        </>
      )}

      {user && (
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="border-line flex items-center gap-2 rounded-full border px-2 py-1 text-sm transition-colors hover:bg-white/5"
          >
            <span className="bg-brand flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white">
              {initials(user.name, user.email)}
            </span>
            <span className="max-w-[100px] truncate font-medium">
              {user.name ?? user.email.split("@")[0]}
            </span>
            <svg
              className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="border-line bg-surface absolute top-full right-0 z-30 mt-2 w-56 rounded-xl border shadow-lg">
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

      <ThemeToggle />
    </div>
  );
}
