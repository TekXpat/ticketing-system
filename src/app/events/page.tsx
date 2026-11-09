import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
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

  const user = await getCurrentUser();
  const canCreate = user?.role === "ORGANISER";

  const events = await db.event.findMany({
    where: active ? { kind: active } : undefined,
    orderBy: { startsAt: "asc" },
    include: { ticketTypes: { orderBy: { price: "desc" } } },
  });
  const left = await ticketsLeftByType(events.flatMap((event) => event.ticketTypes));

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Ticket</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by kind" className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const selected = (active ?? "all") === filter.value;
            return (
              <Link
                key={filter.value}
                href={filter.value === "all" ? "/events" : `/events?kind=${filter.value}`}
                aria-current={selected ? "page" : undefined}
                className={selected ? "chip chip-active" : "chip"}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>

        {canCreate ? (
          <Link href="/events/new" className="btn btn-primary">
            Create a ticket
          </Link>
        ) : null}
      </div>

      {events.length === 0 ? (
        <p className="text-muted">No events here yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <li key={event.id} className="card flex flex-col gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="text-muted text-sm">
                  {event.kind}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
                <p className="text-muted text-sm">
                  {event.startsAt.toLocaleString("en-GB", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              <ul className="border-line space-y-2 border-t pt-3">
                {event.ticketTypes.map((ticketType) => {
                  const remaining = left.get(ticketType.id) ?? 0;
                  return (
                    <li
                      key={ticketType.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">{ticketType.name}</span>{" "}
                        <span className="text-muted">
                          · {ticketType.price.toLocaleString("en-GB")}
                        </span>
                      </span>
                      {remaining === 0 ? (
                        <span className="badge badge-red">Sold out</span>
                      ) : (
                        <span className="badge badge-green">
                          {remaining.toLocaleString("en-GB")} left
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto">
                <Link href={`/events/${event.id}`} className="btn btn-primary">
                  {event.seatLayoutId ? "Choose seats" : "Buy tickets"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
