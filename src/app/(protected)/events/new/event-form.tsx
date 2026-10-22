"use client";

import { useActionState } from "react";
import { createEvent, type CreateEventState } from "@/lib/events/actions";

const initialState: CreateEventState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-red-600">{messages[0]}</p>;
}

export default function EventForm({ layouts }: { layouts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const errors = state.fieldErrors ?? {};
  const inputClass = "w-full rounded border border-gray-300 px-3 py-2";

  return (
    <section className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Create an event</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input id="title" name="title" className={inputClass} />
          <FieldError messages={errors.title} />
        </div>
        <div>
          <label htmlFor="kind" className="block text-sm font-medium">
            Kind (concert, bus, conference...)
          </label>
          <input id="kind" name="kind" className={inputClass} />
          <FieldError messages={errors.kind} />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location (optional)
          </label>
          <input id="location" name="location" className={inputClass} />
        </div>
        <div>
          <label htmlFor="startsAt" className="block text-sm font-medium">
            Starts at
          </label>
          <input id="startsAt" name="startsAt" type="datetime-local" className={inputClass} />
          <FieldError messages={errors.startsAt} />
        </div>
        <div>
          <label htmlFor="seatLayoutId" className="block text-sm font-medium">
            Seat layout (leave empty for no seats)
          </label>
          <select id="seatLayoutId" name="seatLayoutId" className={inputClass} defaultValue="">
            <option value="">No seats (general admission)</option>
            {layouts.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
        </div>
        <h2 className="pt-2 text-lg font-semibold">First ticket type</h2>
        <div>
          <label htmlFor="ticketName" className="block text-sm font-medium">
            Name (VIP, Standard...)
          </label>
          <input id="ticketName" name="ticketName" className={inputClass} />
          <FieldError messages={errors.ticketName} />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium">
            Price (whole number)
          </label>
          <input id="price" name="price" type="number" min="0" className={inputClass} />
          <FieldError messages={errors.price} />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium">
            Quantity
          </label>
          <input id="quantity" name="quantity" type="number" min="1" className={inputClass} />
          <FieldError messages={errors.quantity} />
        </div>
        <div>
          <label htmlFor="maxPerCustomer" className="block text-sm font-medium">
            Max per customer (optional)
          </label>
          <input
            id="maxPerCustomer"
            name="maxPerCustomer"
            type="number"
            min="1"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Create event"}
        </button>
      </form>
    </section>
  );
}
