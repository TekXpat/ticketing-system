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
            <li key={type.id} className="card flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold">{type.name}</p>
                <p className="text-muted flex flex-wrap items-center gap-2 text-sm">
                  {type.price.toLocaleString("en-GB")}
                  {soldOut ? (
                    <span className="badge badge-red">Sold out</span>
                  ) : (
                    <span className="badge badge-green">
                      {type.left.toLocaleString("en-GB")} left
                    </span>
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
                className="input w-20"
              />
            </li>
          );
        })}
      </ul>

      <p className="text-lg font-semibold">
        {tickets} ticket(s) · Total {total.toLocaleString("en-GB")}
      </p>

      <label className="block text-sm font-medium">
        Mobile money number
        <input
          name="phone"
          inputMode="numeric"
          placeholder="0788123456"
          required
          className="input mt-1"
        />
      </label>

      {state.error ? (
        <p role="alert" className="alert-error">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending || tickets === 0} className="btn btn-primary">
        {pending ? "Creating order..." : "Pay with mobile money"}
      </button>
    </form>
  );
}
