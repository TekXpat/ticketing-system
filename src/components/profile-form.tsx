"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status =
  { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

// Example client component: local state, a call to an API route, and a
// router refresh so server components re-render with the new data.
export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "saving" });

    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus({ kind: "error", message: body?.error ?? "Could not save your name." });
      return;
    }

    setStatus({ kind: "saved" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-sm space-y-3">
      <label htmlFor="display-name" className="block text-sm font-medium">
        Display name
      </label>
      <input
        id="display-name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setStatus({ kind: "idle" });
        }}
        className="input"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status.kind === "saving"} className="btn btn-primary">
          {status.kind === "saving" ? "Saving…" : "Save"}
        </button>
        {status.kind === "saved" && (
          <span className="text-success text-sm font-medium">Saved.</span>
        )}
        {status.kind === "error" && (
          <span role="alert" className="text-danger text-sm font-medium">
            {status.message}
          </span>
        )}
      </div>
    </form>
  );
}
