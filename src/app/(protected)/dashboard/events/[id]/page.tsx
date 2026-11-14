import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganiser } from "@/lib/auth/session";
import { getOrganiserStats, percent } from "@/lib/dashboard/stats";
import { ProgressBar } from "@/components/progress-bar";

export const dynamic = "force-dynamic";

const n = (value: number) => value.toLocaleString("en-GB");

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOrganiser();
  const { events } = await getOrganiserStats(user.id);
  const event = events.find((e) => e.id === id);
  if (!event) notFound();

  const pct = percent(event.sold, event.quantity);

  const cards = [
    { label: "Tickets Sold", value: n(event.sold) },
    { label: "Tickets Left", value: n(event.left) },
    { label: "Revenue", value: `${n(event.revenue)} RWF` },
    { label: "Scanned at Gate", value: `${n(event.scanned)} / ${n(event.issued)}` },
  ];

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/dashboard" className="nav-link text-sm">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-muted text-sm">
          {event.kind} ·{" "}
          {event.startsAt.toLocaleString("en-GB", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </div>

      {/* Summary cards */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label} className="card space-y-1">
            <p className="text-muted text-sm">{card.label}</p>
            <p className="text-2xl font-bold">{card.value}</p>
          </li>
        ))}
      </ul>

      {/* Sales progress */}
      <div className="card space-y-3">
        <h2 className="font-semibold">Sales Progress</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={pct} label={`${event.title} sales progress`} />
          </div>
          <span className="text-muted w-24 text-right text-sm">
            {pct}% ({n(event.sold)} of {n(event.quantity)})
          </span>
        </div>
      </div>

      {/* Ticket breakdown */}
      <div className="card space-y-3">
        <h2 className="font-semibold">Ticket Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-line border-b">
                <th className="py-2 pr-4 font-medium">Ticket Type</th>
                <th className="py-2 pr-4 text-right font-medium">Sold</th>
                <th className="py-2 pr-4 text-right font-medium">Left</th>
                <th className="py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {event.types.map((type) => (
                <tr key={type.id} className="border-line border-t">
                  <td className="py-2 pr-4 font-medium">{type.name}</td>
                  <td className="py-2 pr-4 text-right">
                    {n(type.sold)} of {n(type.quantity)}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {n(Math.max(0, type.quantity - type.sold))}
                  </td>
                  <td className="py-2 text-right">{n(type.revenue)} RWF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event information */}
      <div className="card space-y-3">
        <h2 className="font-semibold">Event Information</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted w-32 shrink-0">Category</dt>
            <dd className="font-medium capitalize">{event.kind}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted w-32 shrink-0">Date &amp; Time</dt>
            <dd className="font-medium">
              {event.startsAt.toLocaleString("en-GB", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted w-32 shrink-0">Total Capacity</dt>
            <dd className="font-medium">{n(event.quantity)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted w-32 shrink-0">Ticket Types</dt>
            <dd className="font-medium">{event.types.map((t) => t.name).join(", ")}</dd>
          </div>
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/events/${event.id}/edit`} className="btn btn-secondary">
          Edit Event
        </Link>
        <Link href={`/tickets?event=${event.id}`} className="btn btn-primary">
          View Issued Tickets
        </Link>
      </div>
    </section>
  );
}
