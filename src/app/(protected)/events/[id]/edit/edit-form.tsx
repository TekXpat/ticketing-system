"use client";

import { useActionState, useState } from "react";
import { editEvent, removeEvent } from "@/lib/events/edit-actions";

type TicketType = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  seated: boolean;
};

type Props = {
  eventId: string;
  defaultValues: {
    title: string;
    kind: string;
    location: string;
    startsAt: string;
    ticketTypes: TicketType[];
  };
};

export function EditForm({ eventId, defaultValues }: Props) {
  const [types, setTypes] = useState<TicketType[]>(defaultValues.ticketTypes);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const action = editEvent.bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, {});

  function updateType(index: number, field: keyof TicketType, value: string | number) {
    setTypes((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function addType() {
    setTypes((prev) => [...prev, { name: "", price: 0, quantity: 1, seated: false }]);
  }

  function removeType(index: number) {
    setTypes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDelete() {
    const result = await removeEvent(eventId);
    if (result?.error) setDeleteError(result.error);
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      {/* Title */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={defaultValues.title}
          className="input w-full"
          required
        />
        {state.fieldErrors?.title && (
          <p className="text-xs text-red-500">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Kind */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="kind">
          Category
        </label>
        <select id="kind" name="kind" defaultValue={defaultValues.kind} className="input w-full">
          <option value="bus">Bus</option>
          <option value="concert">Concert</option>
          <option value="conference">Conference</option>
        </select>
      </div>

      {/* Location */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="location">
          Location / Route
        </label>
        <input
          id="location"
          name="location"
          defaultValue={defaultValues.location}
          className="input w-full"
        />
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="startsAt">
          Date &amp; Time
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          defaultValue={defaultValues.startsAt}
          className="input w-full"
          required
        />
        {state.fieldErrors?.startsAt && (
          <p className="text-xs text-red-500">{state.fieldErrors.startsAt[0]}</p>
        )}
      </div>

      {/* Ticket types */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Ticket Types</p>
        {state.fieldErrors?.ticketTypes && (
          <p className="text-xs text-red-500">{state.fieldErrors.ticketTypes[0]}</p>
        )}
        {types.map((type, i) => (
          <div key={i} className="card flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1 space-y-1">
              <label className="text-muted text-xs">Name</label>
              <input
                className="input w-full"
                value={type.name}
                onChange={(e) => updateType(i, "name", e.target.value)}
                placeholder="e.g. Regular"
              />
            </div>
            <div className="w-28 space-y-1">
              <label className="text-muted text-xs">Price (RWF)</label>
              <input
                type="number"
                min={0}
                className="input w-full"
                value={type.price}
                onChange={(e) => updateType(i, "price", Number(e.target.value))}
              />
            </div>
            <div className="w-28 space-y-1">
              <label className="text-muted text-xs">Quantity</label>
              <input
                type="number"
                min={1}
                className="input w-full"
                value={type.quantity}
                disabled={type.seated}
                onChange={(e) => updateType(i, "quantity", Number(e.target.value))}
              />
            </div>
            {!type.seated && types.length > 1 && (
              <button
                type="button"
                onClick={() => removeType(i)}
                className="btn btn-secondary text-xs"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {types.every((t) => !t.seated) && (
          <button type="button" onClick={addType} className="btn btn-secondary text-sm">
            + Add ticket type
          </button>
        )}
      </div>

      {/* Hidden ticket types JSON */}
      <input
        type="hidden"
        name="ticketTypes"
        value={JSON.stringify(
          types.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
        )}
      />

      {/* Save */}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving…" : "Save Changes"}
      </button>

      {/* Delete */}
      <div className="border-line space-y-3 border-t pt-4">
        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="btn btn-secondary w-full text-red-400"
          >
            Delete Event
          </button>
        ) : (
          <div className="card space-y-3 border-red-500/40">
            <p className="text-sm">
              Are you sure you want to delete this event? This action may affect event availability
              and ticket management.
            </p>
            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
