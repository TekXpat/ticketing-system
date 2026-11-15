import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ticketsLeftByType } from "@/lib/events/availability";
import { EVENT_KINDS } from "@/lib/events/schemas";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "bus", label: "Buses" },
  { value: "concert", label: "Concerts" },
  { value: "conference", label: "Conferences" },
] as const;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
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
      <h1 className="text-3xl font-bold">Tickets</h1>

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

        {canCreate && (
          <Link href="/events/new" className="btn btn-primary">
            Create a ticket
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-muted">No events here yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {events.map((event) => {
            const isOwner = user?.id === event.organiserId;
            return (
              <li key={event.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
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
                  {isOwner && (
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="btn btn-secondary shrink-0 text-xs"
                    >
                      Edit
                    </Link>
                  )}
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

                <div className="mt-auto flex gap-2">
                  <Link href={`/events/${event.id}`} className="btn btn-primary flex-1 text-center">
                    {event.seatLayoutId ? "Choose seats" : "Buy tickets"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
