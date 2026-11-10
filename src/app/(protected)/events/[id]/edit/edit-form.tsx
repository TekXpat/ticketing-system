"use client";

import { useActionState, useState } from "react";
import { deleteEvent, updateEvent, type EditEventState } from "@/lib/events/edit-actions";

type TypeView = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxPerCustomer: number | null;
  seated: boolean;
};
type Row = { id: string; name: string; price: string; quantity: string; maxPerCustomer: string };

const initialState: EditEventState = {};

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

export function EditForm({
  event,
}: {
  event: { id: string; title: string; location: string; startsAt: string; types: TypeView[] };
}) {
  const [state, formAction, pending] = useActionState(updateEvent, initialState);
  const errors = state.fieldErrors ?? {};

  const [title, setTitle] = useState(event.title);
  const [location, setLocation] = useState(event.location);
  const [startsAt, setStartsAt] = useState(event.startsAt);
  const [rows, setRows] = useState<Row[]>(
    event.types.map((type) => ({
      id: type.id,
      name: type.name,
      price: String(type.price),
      quantity: String(type.quantity),
      maxPerCustomer: type.maxPerCustomer === null ? "" : String(type.maxPerCustomer),
    })),
  );

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((previous) => previous.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  const payload = JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: row.price === "" ? null : Number(row.price),
      quantity: row.quantity === "" ? null : Number(row.quantity),
      maxPerCustomer: row.maxPerCustomer === "" ? null : Number(row.maxPerCustomer),
    })),
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="card space-y-4">
        <input type="hidden" name="eventId" value={event.id} />

        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
          <FieldError messages={errors.title} />
        </div>

        <div className="space-y-1">
          <label htmlFor="location" className="block text-sm font-medium">
            Location (optional)
          </label>
          <input
            id="location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
            onChange={(e) => setStartsAt(e.target.value)}
            className="input"
          />
          <FieldError messages={errors.startsAt} />
        </div>

        <h2 className="border-line border-t pt-4 text-xl font-semibold">Ticket types</h2>
        <p className="text-muted text-sm">
          A new price applies to new orders only. A quantity cannot go below what is already sold
          or reserved. The number of seats of a seated ticket cannot change.
        </p>

        {rows.map((row, index) => {
          const seated = event.types[index]?.seated ?? false;
          return (
            <fieldset
              key={row.id}
              className="border-line bg-surface-2 space-y-3 rounded-lg border p-3"
            >
              <legend className="px-1 text-sm font-semibold">Ticket type {index + 1}</legend>
              <div className="space-y-1">
                <label htmlFor={`name-${row.id}`} className="block text-sm font-medium">
                  Name
                </label>
                <input
                  id={`name-${row.id}`}
                  value={row.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  className="input"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`price-${row.id}`} className="block text-sm font-medium">
                  Price (whole number)
                </label>
                <input
                  id={`price-${row.id}`}
                  type="number"
                  min="0"
                  value={row.price}
                  onChange={(e) => updateRow(index, { price: e.target.value })}
                  className="input"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`quantity-${row.id}`} className="block text-sm font-medium">
                  {seated ? "Seats (cannot be changed)" : "Quantity"}
                </label>
                <input
                  id={`quantity-${row.id}`}
                  type="number"
                  min="1"
                  value={row.quantity}
                  disabled={seated}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  className="input"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`max-${row.id}`} className="block text-sm font-medium">
                  Max per customer (optional)
                </label>
                <input
                  id={`max-${row.id}`}
                  type="number"
                  min="1"
                  value={row.maxPerCustomer}
                  onChange={(e) => updateRow(index, { maxPerCustomer: e.target.value })}
                  className="input"
                />
              </div>
            </fieldset>
          );
        })}

        <FieldError messages={errors.ticketTypes} />
        {state.error ? (
          <p role="alert" className="alert-error">
            {state.error}
          </p>
        ) : null}

        <input type="hidden" name="ticketTypes" value={payload} />
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <form
        action={deleteEvent}
        onSubmit={(e) => {
          if (!window.confirm("Delete this event? This cannot be undone.")) e.preventDefault();
        }}
        className="card space-y-2"
      >
        <input type="hidden" name="eventId" value={event.id} />
        <p className="text-muted text-sm">
          An event can be deleted only while nobody has bought or reserved a ticket.
        </p>
        <button type="submit" className="btn btn-danger">
          Delete this event
        </button>
      </form>
    </div>
  );
}