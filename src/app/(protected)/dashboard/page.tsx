import Link from "next/link";
import { ProgressBar } from "@/components/progress-bar";
import { requireOrganiser } from "@/lib/auth/session";
import { getOrganiserStats, percent } from "@/lib/dashboard/stats";

export const dynamic = "force-dynamic";

const n = (value: number) => value.toLocaleString("en-GB");

export default async function DashboardPage() {
  const user = await requireOrganiser();
  const { events, totals } = await getOrganiserStats(user.id);

  const summary = [
    {
      label: "Tickets Sold",
      value: n(totals.sold),
      icon: "🎟️",
    },
    {
      label: "Tickets Left",
      value: n(totals.left),
      icon: "📦",
    },
    {
      label: "Revenue",
      value: `${n(totals.revenue)} RWF`,
      icon: "💰",
    },
    {
      label: "Scanned at Gate",
      value: `${n(totals.scanned)} of ${n(totals.issued)}`,
      icon: "📲",
    },
  ];

  const categories = [
    { label: "Buses", kinds: ["bus"] },
    { label: "Concerts", kinds: ["concert"] },
    { label: "Flights", kinds: ["flight"] },
    { label: "Theatres", kinds: ["theatre"] },
    { label: "Conferences", kinds: ["conference"] },
  ].filter((cat) => events.some((e) => cat.kinds.includes(e.kind.toLowerCase())));

  const eventsFor = (cat: { kinds: string[] }) =>
    events.filter((e) => cat.kinds.includes(e.kind.toLowerCase()));

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted text-sm">Overview of your events and ticket sales.</p>
      </div>

      {/* Summary cards */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <li key={item.label} className="card flex items-center gap-4">
            <div className="bg-brand/15 text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl">
              {item.icon}
            </div>
            <div>
              <p className="text-muted text-xs">{item.label}</p>
              <p className="text-xl leading-tight font-bold">{item.value}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Event tables */}
      {events.length === 0 ? (
        <p className="text-muted">You have no events yet.</p>
      ) : categories.length === 0 ? (
        <EventTable events={events} />
      ) : (
        <div className="space-y-10">
          {categories.map((cat) => (
            <div key={cat.label} className="space-y-3">
              <h2 className="text-base font-semibold">{cat.label}</h2>
              <EventTable events={eventsFor(cat)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EventTable({
  events,
}: {
  events: Awaited<ReturnType<typeof getOrganiserStats>>["events"];
}) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-line border-b">
            <th className="px-4 py-3 font-medium">Event</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 text-right font-medium">Sold / Total</th>
            <th className="min-w-[160px] px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 text-right font-medium">Revenue</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const pct = percent(event.sold, event.quantity);
            return (
              <tr
                key={event.id}
                className="border-line border-t transition-colors hover:bg-white/5"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="hover:text-brand transition-colors"
                  >
                    {event.title}
                  </Link>
                </td>
                <td className="text-muted px-4 py-3 whitespace-nowrap">
                  {event.startsAt.toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  {n(event.sold)} / {n(event.quantity)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={pct} label={`${event.title} tickets sold`} />
                    </div>
                    <span className="text-muted w-8 text-right text-xs">{pct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{n(event.revenue)} RWF</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/events/${event.id}/edit`}
                    className="btn btn-secondary py-1 text-xs"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
