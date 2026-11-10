import { ProgressBar } from "@/components/progress-bar";
import { requireOrganiser } from "@/lib/auth/session";
import { groupByKind } from "@/lib/dashboard/groups";
import { getOrganiserStats, percent, type EventStats } from "@/lib/dashboard/stats";
import { gateForKind } from "@/lib/tickets/gates";

export const dynamic = "force-dynamic";

const n = (value: number) => value.toLocaleString("en-GB");

function EventCard({ event }: { event: EventStats }) {
  return (
    <li className="card space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">{event.title}</h3>
        <p className="text-muted text-sm">
          {event.startsAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {n(event.sold)} sold · {n(event.left)} left
          </span>
          <span className="text-muted">
            {percent(event.sold, event.quantity)}% of {n(event.quantity)}
          </span>
        </div>
        <ProgressBar
          value={percent(event.sold, event.quantity)}
          label={`${event.title} tickets sold`}
        />
        <p className="text-sm">
          Revenue: <span className="font-semibold">{n(event.revenue)}</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-1 pr-3 font-medium">Ticket type</th>
              <th className="py-1 pr-3 font-medium">Sold</th>
              <th className="py-1 pr-3 font-medium">Left</th>
              <th className="py-1 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {event.types.map((type) => (
              <tr key={type.id} className="border-line border-t">
                <td className="py-2 pr-3 font-medium">{type.name}</td>
                <td className="py-2 pr-3">
                  {n(type.sold)} of {n(type.quantity)}
                </td>
                <td className="py-2 pr-3">{n(Math.max(0, type.quantity - type.sold))}</td>
                <td className="py-2">{n(type.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-line space-y-2 border-t pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {n(event.scanned)} scanned · {n(event.issued - event.scanned)} not yet scanned
          </span>
          <span className="text-muted">{n(event.issued)} tickets issued</span>
        </div>
        <ProgressBar
          value={percent(event.scanned, event.issued)}
          label={`${event.title} tickets scanned at the gate`}
        />
      </div>
    </li>
  );
}

// Organisers only. Staff and customers are sent to the events list, even if
// they type the address.
export default async function DashboardPage() {
  const user = await requireOrganiser();
  const { events } = await getOrganiserStats(user.id);
  const groups = groupByKind(events);

  return (
    <section className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted">
          Your events, grouped by category, so bus seats are never added to concert places. Sold and
          revenue count paid orders only.
        </p>
      </div>

      {groups.length === 0 ? <p className="text-muted">You have no events yet.</p> : null}

      {groups.map((group) => {
        const summary = [
          { label: "Tickets sold", value: n(group.totals.sold) },
          { label: "Tickets left", value: n(group.totals.left) },
          { label: "Revenue", value: n(group.totals.revenue) },
          {
            label: "Scanned at the gate",
            value: `${n(group.totals.scanned)} of ${n(group.totals.issued)}`,
          },
        ];
        return (
          <div key={group.kind} className="space-y-4">
            <h2 className="text-2xl font-semibold">
              {gateForKind(group.kind)?.label ?? group.kind} · {n(group.totals.events)} event(s)
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summary.map((item) => (
                <li key={item.label} className="card space-y-1">
                  <p className="text-muted text-sm">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </li>
              ))}
            </ul>
            <ul className="space-y-4">
              {group.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
