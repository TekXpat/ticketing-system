import Link from "next/link";
import { db } from "@/lib/db";
import { ticketsLeftByType } from "@/lib/events/availability";
import { EVENT_KINDS } from "@/lib/events/schemas";

// Events change often, so build this page fresh on every visit.
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "bus", label: "Buses" },
  { value: "concert", label: "Concerts" },
  { value: "conference", label: "Conferences" },
] as const;

// Public page: anyone can see the list of events.
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  // Anything that is not one of the three kinds means "All".
  const active = EVENT_KINDS.find((item) => item === kind);

  const events = await db.event.findMany({
    where: active ? { kind: active } : undefined,
    orderBy: { startsAt: "asc" },
    include: { ticketTypes: { orderBy: { price: "desc" } } },
  });
  const left = await ticketsLeftByType(events.flatMap((event) => event.ticketTypes));

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Ticket</h1>

      <nav aria-label="Filter by kind" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const selected = (active ?? "all") === filter.value;
          return (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/events" : `/events?kind=${filter.value}`}
              aria-current={selected ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${
                selected
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-400 bg-white text-gray-800"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {events.length === 0 ? (
        <p className="text-gray-600">No events here yet.</p>
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
              <Link
                href={`/events/${event.id}`}
                className="mt-2 inline-block text-blue-700 underline"
              >
                {event.seatLayoutId ? "Choose seats" : "Buy tickets"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
