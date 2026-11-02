"use client";

import { useActionState, useState } from "react";
import { checkoutQuantities, type QuantityCheckoutState } from "@/lib/orders/quantity-checkout";

type TypeView = { id: string; name: string; price: number; left: number; max: number };

const initialState: QuantityCheckoutState = {};

export function QuantityForm({ eventId, types }: { eventId: string; types: TypeView[] }) {
  const [state, action, pending] = useActionState(checkoutQuantities, initialState);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [names, setNames] = useState<Record<string, string>>({});

  // How many tickets of a type are wanted, never more than the form allows.
  const countOf = (type: TypeView) => Math.min(Number(quantities[type.id]) || 0, type.max);

  const tickets = types.reduce((sum, type) => sum + countOf(type), 0);
  const total = types.reduce((sum, type) => sum + countOf(type) * type.price, 0);

  return (
    <form action={action} className="max-w-md space-y-4">
      <input type="hidden" name="eventId" value={eventId} />

      <ul className="space-y-3">
        {types.map((type) => {
          const soldOut = type.left === 0;
          const count = countOf(type);
          return (
            <li key={type.id} className="card space-y-3">
              <div className="flex items-center justify-between gap-3">
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
              </div>

              {count > 0 ? (
                <div className="border-line space-y-2 border-t pt-3">
                  <p className="text-sm font-medium">Who is each {type.name} ticket for?</p>
                  {Array.from({ length: count }, (_, index) => {
                    const key = `${type.id}-${index}`;
                    return (
                      <label key={key} className="block text-sm">
                        Name for {type.name} ticket {index + 1}
                        <input
                          name={`name-${type.id}-${index}`}
                          autoComplete="off"
                          placeholder="Full name"
                          maxLength={100}
                          required
                          value={names[key] ?? ""}
                          onChange={(event) =>
                            setNames((previous) => ({ ...previous, [key]: event.target.value }))
                          }
                          className="input mt-1"
                        />
                      </label>
                    );
                  })}
                </div>
              ) : null}
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
