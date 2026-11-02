"use client";

import { useActionState } from "react";
import { checkoutHeldSeats, type CheckoutState } from "@/lib/orders/checkout";

type SeatView = { seatId: string; label: string };

export function CheckoutForm({ eventId, seats }: { eventId: string; seats: SeatView[] }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkoutHeldSeats, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />

      <div className="space-y-3">
        <p className="text-sm font-medium">Who is each ticket for?</p>
        {seats.map((seat) => (
          <label key={seat.seatId} className="block text-sm">
            Name for seat {seat.label}
            <input
              name={`name-${seat.seatId}`}
              autoComplete="off"
              placeholder="Full name"
              maxLength={100}
              required
              className="input mt-1"
            />
          </label>
        ))}
      </div>

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
