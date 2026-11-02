import { ProgressBar } from "@/components/progress-bar";
import { requireOrganiser } from "@/lib/auth/session";
import { getOrganiserStats, percent } from "@/lib/dashboard/stats";

export const dynamic = "force-dynamic";

const n = (value: number) => value.toLocaleString("en-GB");

// Organisers only. Staff and customers are sent to the events list, even if
// they type the address.
export default async function DashboardPage() {
  const user = await requireOrganiser();
  const { events, totals } = await getOrganiserStats(user.id);

  const summary = [
    { label: "Tickets sold", value: n(totals.sold) },
    { label: "Tickets left", value: n(totals.left) },
    { label: "Total revenue", value: n(totals.revenue) },
    { label: "Scanned at the gate", value: `${n(totals.scanned)} of ${n(totals.issued)}` },
  ];

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted">
          Progress of your {n(totals.events)} event(s). Sold and revenue count paid orders only.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <li key={item.label} className="card space-y-1">
            <p className="text-muted text-sm">{item.label}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </li>
        ))}
      </ul>

      {events.length === 0 ? (
        <p className="text-muted">You have no events yet.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="card space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="text-muted text-sm">
                  {event.kind} ·{" "}
                  {event.startsAt.toLocaleString("en-GB", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
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
          ))}
        </ul>
      )}
    </section>
  );
}
