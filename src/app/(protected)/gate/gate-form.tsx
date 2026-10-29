"use client";

import { useActionState } from "react";
import { verifyTicket, type GateState } from "@/lib/tickets/actions";

const initialState: GateState = {};

export function GateForm() {
  const [state, action, pending] = useActionState(verifyTicket, initialState);
  const result = state.result;

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <label className="block text-sm font-medium">
          Ticket code
          <input name="code" autoComplete="off" required className="input mt-1 font-mono text-sm" />
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Checking..." : "Check ticket"}
        </button>
      </form>

      {result?.status === "invalid" ? (
        <div
          role="status"
          className="border-danger bg-danger-soft text-danger rounded-xl border-2 p-5"
        >
          <p className="text-xl font-bold">INVALID</p>
          <p>This is not a genuine ticket.</p>
        </div>
      ) : null}

      {result?.status === "valid" ? (
        <div
          role="status"
          className="border-success bg-success-soft text-success rounded-xl border-2 p-5"
        >
          <p className="text-xl font-bold">VALID: let them in.</p>
          <p>
            {result.event} · {result.ticketType}
            {result.seat ? ` · seat ${result.seat}` : ""}
          </p>
        </div>
      ) : null}

      {result?.status === "already_used" ? (
        <div
          role="status"
          className="border-warning bg-warning-soft text-warning rounded-xl border-2 p-5"
        >
          <p className="text-xl font-bold">ALREADY USED</p>
          <p>
            {result.event} · {result.ticketType}
            {result.seat ? ` · seat ${result.seat}` : ""}
          </p>
          <p>
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
