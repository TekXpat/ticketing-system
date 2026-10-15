import { db } from "@/lib/db";

// Events change often, so build this page fresh on every visit.
export const dynamic = "force-dynamic";

// Public page: anyone can see the list of events.
export default async function EventsPage() {
  const events = await db.event.findMany({
    orderBy: { startsAt: "asc" },
    include: { ticketTypes: { orderBy: { price: "asc" } } },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Ticket</h1>
      <a href="/events/new" className="inline-block text-blue-700 underline">
        Create a Ticket{" "}
      </a>
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
                {event.ticketTypes.map((ticketType) => (
                  <li key={ticketType.id}>
                    {ticketType.name} · {ticketType.price.toLocaleString("en-GB")} ·{" "}
                    {ticketType.quantity} tickets
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
