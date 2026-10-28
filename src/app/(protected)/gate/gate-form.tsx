"use client";

import { useActionState } from "react";
import { verifyTicket, type GateState } from "@/lib/tickets/actions";

const initialState: GateState = {};

export function GateForm() {
  const [state, action, pending] = useActionState(verifyTicket, initialState);
  const result = state.result;

  return (
    <div className="max-w-md space-y-4">
      <form action={action} className="space-y-3">
        <label className="block text-sm font-medium">
          Ticket code
          <input
            name="code"
            autoComplete="off"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Checking..." : "Check ticket"}
        </button>
      </form>

      {result?.status === "invalid" ? (
        <p
          role="status"
          className="rounded border border-red-600 bg-red-50 p-3 font-medium text-red-800"
        >
          INVALID: this is not a genuine ticket.
        </p>
      ) : null}

      {result?.status === "valid" ? (
        <div
          role="status"
          className="rounded border border-green-700 bg-green-50 p-3 text-green-900"
        >
          <p className="font-medium">VALID: let them in.</p>
          <p className="text-sm">
            {result.event} · {result.ticketType}
            {result.seat ? ` · seat ${result.seat}` : ""}
          </p>
        </div>
      ) : null}

      {result?.status === "already_used" ? (
        <div
          role="status"
          className="rounded border border-amber-600 bg-amber-50 p-3 text-amber-900"
        >
          <p className="font-medium">ALREADY USED</p>
          <p className="text-sm">
            {result.event} · {result.ticketType}
            {result.seat ? ` · seat ${result.seat}` : ""}
          </p>
          <p className="text-sm">
            First scanned{" "}
            {new Date(result.usedAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
