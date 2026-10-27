"use client";

import { useState, useTransition } from "react";
import { holdSeat, releaseSeat, releaseMySeats } from "@/lib/seats/actions";

type SeatView = { id: string; label: string; colIndex: number };

type Props = {
  eventId: string;
  seats: SeatView[];
  takenSeatIds: string[];
  mySeatIds: string[];
};

export function SeatPicker({ eventId, seats, takenSeatIds, mySeatIds }: Props) {
  const [taken, setTaken] = useState(() => new Set(takenSeatIds));
  const [mine, setMine] = useState(() => new Set(mySeatIds));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = seats.length === 0 ? 1 : Math.max(...seats.map((s) => s.colIndex)) + 1;
  const free = seats.length - taken.size - mine.size;

  function choose(seatId: string) {
    setMessage(null);
    startTransition(async () => {
      // Clicking a seat you already hold gives it back.
      if (mine.has(seatId)) {
        const result = await releaseSeat(eventId, seatId);
        if (result.ok) {
          setMine((prev) => {
            const next = new Set(prev);
            next.delete(seatId);
            return next;
          });
          setMessage("Seat released.");
        } else {
          setMessage(result.error);
        }
        return;
      }

      const result = await holdSeat(eventId, seatId);
      if (result.ok) {
        setMine((prev) => new Set(prev).add(seatId));
        setMessage(
          `Seat held until ${result.expiresAt.toLocaleTimeString("en-GB", { timeStyle: "short" })}.`,
        );
      } else {
        // Someone else won the race, so show the seat as taken from now on.
        setTaken((prev) => new Set(prev).add(seatId));
        setMessage(result.error);
      }
    });
  }

  function cancelAll() {
    setMessage(null);
    startTransition(async () => {
      const { releasedSeatIds } = await releaseMySeats(eventId);
      setMine((prev) => {
        const next = new Set(prev);
        releasedSeatIds.forEach((id) => next.delete(id));
        return next;
      });
      setMessage(
        releasedSeatIds.length > 0
          ? `Released ${releasedSeatIds.length} seat(s).`
          : "You have no seats to release.",
      );
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">
        {free} of {seats.length} seats free · {mine.size} held by you
      </p>

      <div className="grid w-max gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 3rem)` }}>
        {seats.map((seat) => {
          const isMine = mine.has(seat.id);
          const isTaken = taken.has(seat.id);
          const style = isMine
            ? "border-green-700 bg-green-600 text-white"
            : isTaken
              ? "border-gray-300 bg-gray-200 text-gray-400"
              : "border-gray-400 bg-white hover:bg-blue-50";
          return (
            <button
              key={seat.id}
              type="button"
              disabled={isTaken || pending}
              onClick={() => choose(seat.id)}
              title={isMine ? "Click to give this seat back" : undefined}
              className={`h-12 rounded border text-sm font-medium ${style}`}
            >
              {seat.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-600">
        White: free · Green: held by you (click to give back) · Grey: taken
      </p>

      <button
        type="button"
        disabled={pending || mine.size === 0}
        onClick={cancelAll}
        className="rounded border border-red-600 px-3 py-2 text-sm text-red-700 disabled:opacity-40"
      >
        Cancel all my seats
      </button>

      {message ? (
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      ) : null}
    </div>
  );
}
