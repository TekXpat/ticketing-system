import Link from "next/link";
import { db } from "@/lib/db";
import { ticketsLeftByType } from "@/lib/events/availability";

// Events change often, so build this page fresh on every visit.
export const dynamic = "force-dynamic";

// Public page: anyone can see the list of events.
export default async function EventsPage() {
  const events = await db.event.findMany({
    orderBy: { startsAt: "asc" },
    include: { ticketTypes: { orderBy: { price: "desc" } } },
  });
  const left = await ticketsLeftByType(events.flatMap((event) => event.ticketTypes));

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Ticket</h1>
      {events.length === 0 ? (
        <p className="text-gray-600">No events yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded border border-gray-300 p-4">
              <h2 className="text-lg font-semibold">{event.title}</h2>
              <p className="text-sm text-gray-600">
                {event.kind}
                {event.location ? ` · ${event.location}` : ""}
              </p>
              <p className="text-sm text-gray-500">
                {event.startsAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {event.ticketTypes.map((ticketType) => {
                  const remaining = left.get(ticketType.id) ?? 0;
                  return (
                    <li key={ticketType.id}>
                      {ticketType.name} · {ticketType.price.toLocaleString("en-GB")} ·{" "}
                      {remaining === 0 ? (
                        <span className="font-medium text-red-700">Sold out</span>
                      ) : (
                        <span>{remaining.toLocaleString("en-GB")} left</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {event.seatLayoutId ? (
                <Link
                  href={`/events/${event.id}`}
                  className="mt-2 inline-block text-blue-700 underline"
                >
                  Choose seats
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
