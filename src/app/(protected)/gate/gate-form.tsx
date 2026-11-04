"use client";

import { useActionState, useRef } from "react";
import { verifyTicket, type GateState } from "@/lib/tickets/actions";
import { QrReader } from "./qr-reader";

const initialState: GateState = {};

export function GateForm({
  gate,
  event,
}: {
  gate: { slug: string; label: string };
  event: { id: string; title: string };
}) {
  const [state, action, pending] = useActionState(verifyTicket, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const result = state.result;

  // A code read from the camera or a picture goes into the box and is checked.
  function handleScanned(code: string) {
    if (!inputRef.current) return;
    inputRef.current.value = code;
    formRef.current?.requestSubmit();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Admitting: <span className="font-semibold">{event.title}</span>
      </p>

      <QrReader onCode={handleScanned} />

      <form ref={formRef} action={action} className="space-y-3">
        <input type="hidden" name="gate" value={gate.slug} />
        <input type="hidden" name="eventId" value={event.id} />
        <label className="block text-sm font-medium">
          Ticket code
          <input
            ref={inputRef}
            name="code"
            autoComplete="off"
            required
            className="input mt-1 font-mono text-sm"
          />
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

      {result?.status === "wrong_event" ? (
        <div
          role="status"
          className="border-danger bg-danger-soft text-danger rounded-xl border-2 p-6"
        >
          <p className="text-2xl font-bold">Wrong event</p>
          <p>
            This ticket is for {result.ticketEvent}. You are admitting {event.title}.
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