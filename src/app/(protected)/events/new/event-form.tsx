"use client";

import { useActionState, useState } from "react";
import { createEvent, type CreateEventState } from "@/lib/events/actions";

const KINDS = [
  { value: "bus", label: "Bus" },
  { value: "concert", label: "Concert" },
  { value: "conference", label: "Conference" },
] as const;

type Kind = (typeof KINDS)[number]["value"];
type Row = { name: string; price: string; quantity: string; maxPerCustomer: string };

const DEFAULT_CAPACITY: Record<Kind, number> = { bus: 20, concert: 100, conference: 100 };
const PRESETS: Record<Kind, number[]> = { bus: [20], concert: [100, 1000], conference: [100, 500] };
const MAX_ROWS = 10;

const emptyRow = (): Row => ({ name: "", price: "", quantity: "", maxPerCustomer: "" });
const initialState: CreateEventState = {};

function FieldError({ messages }: { messages?: string[] }) {
  const unique = [...new Set(messages ?? [])];
  if (unique.length === 0) return null;
  return (
    <div role="alert" className="text-danger space-y-1 text-sm">
      {unique.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}

export default function EventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const errors = state.fieldErrors ?? {};

  // Controlled fields, so a failed save does not wipe what was typed.
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [kind, setKind] = useState<Kind>("bus");
  const [capacity, setCapacity] = useState(String(DEFAULT_CAPACITY.bus));
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  const isBus = kind === "bus";
  const capacityNumber = Number(capacity) || 0;
  // A bus sells every seat as one ticket type, so it is always fully allocated.
  const allocated = isBus
    ? capacityNumber
    : rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const left = capacityNumber - allocated;

  const smallButton = "btn btn-outline btn-small";

  function changeKind(next: Kind) {
    setKind(next);
    setCapacity(String(DEFAULT_CAPACITY[next]));
    // A bus has a single ticket type.
    if (next === "bus") setRows((previous) => previous.slice(0, 1));
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((previous) => previous.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((previous) => previous.filter((_, i) => i !== index));
  }

  // Give this row whatever capacity is still unallocated.
  function fillRemaining(index: number) {
    const own = Number(rows[index]?.quantity) || 0;
    updateRow(index, { quantity: String(Math.max(0, left + own)) });
  }

  const payload = JSON.stringify(
    rows.map((row) => ({
      name: row.name,
      price: row.price === "" ? null : Number(row.price),
      quantity: isBus ? capacityNumber : row.quantity === "" ? null : Number(row.quantity),
      maxPerCustomer: row.maxPerCustomer === "" ? null : Number(row.maxPerCustomer),
    })),
  );

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Create an event</h1>
      <form action={formAction} className="card space-y-4">
        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input"
          />
          <FieldError messages={errors.title} />
        </div>

        <div className="space-y-1">
          <label htmlFor="kind" className="block text-sm font-medium">
            Kind
          </label>
          <select
            id="kind"
            name="kind"
            value={kind}
            onChange={(event) => changeKind(event.target.value as Kind)}
            className="input"
          >
            {KINDS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <FieldError messages={errors.kind} />
        </div>

        <div className="space-y-1">
          <label htmlFor="location" className="block text-sm font-medium">
            Location (optional)
          </label>
          <input
            id="location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="startsAt" className="block text-sm font-medium">
            Starts at
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="input"
          />
          <FieldError messages={errors.startsAt} />
        </div>

        <div className="space-y-1">
          <label htmlFor="capacity" className="block text-sm font-medium">
            {isBus ? "Number of seats" : "Total capacity (people)"}
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            className="input"
          />
          <div className="mt-1 flex flex-wrap gap-2">
            {PRESETS[kind].map((preset) => (
              <button
                key={preset}
                type="button"
                className={smallButton}
                onClick={() => setCapacity(String(preset))}
              >
                {preset}
              </button>
            ))}
          </div>
          <FieldError messages={errors.capacity} />
        </div>

        <h2 className="border-line border-t pt-4 text-xl font-semibold">
          {isBus ? "Ticket" : "Ticket types"}
        </h2>
        <p className={`text-sm font-medium ${left < 0 ? "text-danger" : "text-muted"}`}>
          Capacity {capacityNumber} · allocated {allocated} ·{" "}
          {left >= 0 ? `${left} left to allocate` : `${-left} over the capacity`}
        </p>

        {rows.map((row, index) => (
          <fieldset
            key={index}
            className="border-line bg-surface-2 space-y-3 rounded-lg border p-3"
          >
            <legend className="px-1 text-sm font-semibold">
              {isBus ? "Ticket" : `Ticket type ${index + 1}`}
            </legend>
            <div className="space-y-1">
              <label htmlFor={`name-${index}`} className="block text-sm font-medium">
                Name (leave empty for Regular)
              </label>
              <input
                id={`name-${index}`}
                value={row.name}
                placeholder="Regular"
                onChange={(event) => updateRow(index, { name: event.target.value })}
                className="input"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`price-${index}`} className="block text-sm font-medium">
                Price (whole number)
              </label>
              <input
                id={`price-${index}`}
                type="number"
                min="0"
                value={row.price}
                onChange={(event) => updateRow(index, { price: event.target.value })}
                className="input"
              />
            </div>
            {isBus ? null : (
              <div className="space-y-1">
                <label htmlFor={`quantity-${index}`} className="block text-sm font-medium">
                  Quantity
                </label>
                <input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={row.quantity}
                  onChange={(event) => updateRow(index, { quantity: event.target.value })}
                  className="input"
                />
              </div>
            )}
            <div className="space-y-1">
              <label htmlFor={`max-${index}`} className="block text-sm font-medium">
                Max per customer (optional)
              </label>
              <input
                id={`max-${index}`}
                type="number"
                min="1"
                value={row.maxPerCustomer}
                onChange={(event) => updateRow(index, { maxPerCustomer: event.target.value })}
                className="input"
              />
            </div>
            {isBus ? null : (
              <div className="flex gap-2">
                <button
                  type="button"
                  className={smallButton}
                  disabled={left <= 0 && !row.quantity}
                  onClick={() => fillRemaining(index)}
                >
                  Use all remaining
                </button>
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => removeRow(index)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            )}
          </fieldset>
        ))}

        <FieldError messages={errors.ticketTypes} />

        {isBus ? null : (
          <button
            type="button"
            className={smallButton}
            disabled={left <= 0 || rows.length >= MAX_ROWS}
            onClick={() => setRows((previous) => [...previous, emptyRow()])}
          >
            + Add another ticket type
          </button>
        )}

        <input type="hidden" name="ticketTypes" value={payload} />

        <div>
          <button type="submit" disabled={pending || left < 0} className="btn btn-primary">
            {pending ? "Saving…" : "Create event"}
          </button>
        </div>
      </form>
    </section>
  );
}
