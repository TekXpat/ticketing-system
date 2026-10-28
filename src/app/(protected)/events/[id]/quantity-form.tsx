"use client";

import { useActionState, useState } from "react";
import { checkoutQuantities, type QuantityCheckoutState } from "@/lib/orders/quantity-checkout";

type TypeView = { id: string; name: string; price: number; left: number; max: number };

const initialState: QuantityCheckoutState = {};

export function QuantityForm({ eventId, types }: { eventId: string; types: TypeView[] }) {
  const [state, action, pending] = useActionState(checkoutQuantities, initialState);
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const tickets = types.reduce((sum, type) => sum + (Number(quantities[type.id]) || 0), 0);
  const total = types.reduce(
    (sum, type) => sum + (Number(quantities[type.id]) || 0) * type.price,
    0,
  );

  return (
    <form action={action} className="max-w-md space-y-4">
      <input type="hidden" name="eventId" value={eventId} />

      <ul className="space-y-3">
        {types.map((type) => {
          const soldOut = type.left === 0;
          return (
            <li
              key={type.id}
              className="flex items-center justify-between gap-3 rounded border border-gray-300 p-3"
            >
              <div>
                <p className="font-medium">{type.name}</p>
                <p className="text-sm text-gray-600">
                  {type.price.toLocaleString("en-GB")} ·{" "}
                  {soldOut ? (
                    <span className="font-medium text-red-700">Sold out</span>
                  ) : (
                    `${type.left.toLocaleString("en-GB")} left`
                  )}
                </p>
              </div>
              <input
                name={`qty-${type.id}`}
                type="number"
                min="0"
                max={type.max}
                disabled={soldOut}
                placeholder="0"
                aria-label={`Quantity of ${type.name}`}
                value={quantities[type.id] ?? ""}
                onChange={(event) =>
                  setQuantities((previous) => ({ ...previous, [type.id]: event.target.value }))
                }
                className="w-20 rounded border border-gray-300 px-2 py-1 disabled:bg-gray-100"
              />
            </li>
          );
        })}
      </ul>

      <p className="font-medium">
        {tickets} ticket(s) · Total {total.toLocaleString("en-GB")}
      </p>

      <label className="block text-sm font-medium">
        Mobile money number
        <input
          name="phone"
          inputMode="numeric"
          placeholder="0788123456"
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || tickets === 0}
        className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creating order..." : "Pay with mobile money"}
      </button>
    </form>
  );
}
