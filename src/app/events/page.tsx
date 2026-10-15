import { db } from "@/lib/db";

// Events change often, so build this page fresh on every visit.
export const dynamic = "force-dynamic";

// Public page: anyone can see the list of events.
export default async function EventsPage() {
  const events = await db.event.findMany({
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { ticketTypes: true } } },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Events</h1>
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
              <p className="text-sm text-gray-500">{event._count.ticketTypes} ticket type(s)</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
