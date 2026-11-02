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
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <span className="badge badge-green">
          {free} of {seats.length} seats free
        </span>
        <span className="badge badge-blue">{mine.size} held by you</span>
      </p>

      <div className="grid w-max gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 3rem)` }}>
        {seats.map((seat) => {
          const isMine = mine.has(seat.id);
          const isTaken = taken.has(seat.id);
          const style = isMine
            ? "border-brand bg-brand text-on-brand"
            : isTaken
              ? "border-line bg-surface-2 text-muted line-through"
              : "border-line bg-surface text-ink hover:border-brand hover:bg-surface-2";
          return (
            <button
              key={seat.id}
              type="button"
              disabled={isTaken || pending}
              onClick={() => choose(seat.id)}
              title={isMine ? "Click to give this seat back" : undefined}
              className={`focus-visible:outline-focus h-12 rounded-lg border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${style}`}
            >
              {seat.label}
            </button>
          );
        })}
      </div>

      <p className="text-muted flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1">
          <span className="border-line bg-surface inline-block h-3 w-3 rounded border" />
          Free
        </span>
        <span className="flex items-center gap-1">
          <span className="border-brand bg-brand inline-block h-3 w-3 rounded border" />
          Held by you (click to give back)
        </span>
        <span className="flex items-center gap-1">
          <span className="border-line bg-surface-2 inline-block h-3 w-3 rounded border" />
          Taken
        </span>
      </p>

      <button
        type="button"
        disabled={pending || mine.size === 0}
        onClick={cancelAll}
        className="btn btn-danger"
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
