"use client";

import { useActionState } from "react";
import { checkoutHeldSeats, type CheckoutState } from "@/lib/orders/checkout";

export function CheckoutForm({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkoutHeldSeats, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
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
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Creating order..." : "Pay with mobile money"}
      </button>
    </form>
  );
}
