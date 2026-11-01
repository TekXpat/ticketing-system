"use client";

import { useActionState } from "react";
import { verifyTicket, type GateState } from "@/lib/tickets/actions";

const initialState: GateState = {};

export function GateForm({ gate }: { gate: { slug: string; label: string } }) {
  const [state, action, pending] = useActionState(verifyTicket, initialState);
  const result = state.result;

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="gate" value={gate.slug} />
        <label className="block text-sm font-medium">
          Ticket code
          <input name="code" autoComplete="off" required className="input mt-1 font-mono text-sm" />
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Checking..." : "Check ticket"}
        </button>
      </form>

      {state.error ? (
        <p role="alert" className="alert-error">
          {state.error}
        </p>
      ) : null}

      {result?.status === "invalid" ? (
        <div
          role="status"
          className="border-danger bg-danger-soft text-danger rounded-xl border-2 p-6"
        >
          <p className="text-2xl font-bold">Ticket not found</p>
          <p>This code is not a genuine ticket.</p>
        </div>
      ) : null}

      {result?.status === "wrong_gate" ? (
        <div
          role="status"
          className="border-danger bg-danger-soft text-danger rounded-xl border-2 p-6"
        >
          <p className="text-2xl font-bold">Wrong gate</p>
          <p>
            Wrong gate. This ticket is for {result.ticketGate}. You are at the {result.gate} gate.
          </p>
          <p className="text-sm">The ticket was not marked as used.</p>
        </div>
      ) : null}

      {result?.status === "valid" ? (
        <div
          role="status"
          className="border-success bg-success-soft text-success rounded-xl border-2 p-6"
        >
          <p className="text-2xl font-bold">Allowed: let them in</p>
          {result.holder ? <p className="text-lg font-semibold">{result.holder}</p> : null}
          <p>
            {result.event} · {result.ticketType}
            {result.seat ? ` · seat ${result.seat}` : ""}
          </p>
        </div>
      ) : null}

      {result?.status === "already_used" ? (
        <div
          role="status"
          className="border-warning bg-warning-soft text-warning rounded-xl border-2 p-6"
        >
          <p className="text-2xl font-bold">Already used</p>
          {result.holder ? <p className="text-lg font-semibold">{result.holder}</p> : null}
          <p>
            {result.event} · {result.ticketType}
            {result.seat ? ` · seat ${result.seat}` : ""}
          </p>
          <p>
            Used on{" "}
            {new Date(result.usedAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "medium",
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
