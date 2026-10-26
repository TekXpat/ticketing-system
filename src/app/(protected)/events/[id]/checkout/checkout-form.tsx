"use client";

import { useActionState } from "react";
import { checkoutHeldSeats, type CheckoutState } from "@/lib/orders/checkout";

export function CheckoutForm({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkoutHeldSeats, {});

  return (
    <form action={action} className="max-w-sm space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="block text-sm font-medium">
        Mobile money number
        <input
          name="phone"
          inputMode="numeric"
          placeholder="0788123456"
          required
          className="mt-1 w-full rounded border border-gray-400 p-2"
        />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creating order..." : "Pay with mobile money"}
      </button>
    </form>
  );
}
