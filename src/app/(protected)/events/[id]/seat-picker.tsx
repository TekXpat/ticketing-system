"use client";

import { useState, useTransition } from "react";
import { holdSeat } from "@/lib/seats/actions";

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

  function choose(seatId: string) {
    setMessage(null);
    startTransition(async () => {
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

  return (
    <div className="space-y-4">
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
              disabled={isMine || isTaken || pending}
              onClick={() => choose(seat.id)}
              className={`h-12 rounded border text-sm font-medium ${style}`}
            >
              {seat.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-600">White: free · Green: held by you · Grey: taken</p>
      {message ? (
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      ) : null}
    </div>
  );
}
