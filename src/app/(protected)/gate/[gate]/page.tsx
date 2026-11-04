import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGateAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { GATES, findGate } from "@/lib/tickets/gates";
import { GateForm } from "../gate-form";

export const dynamic = "force-dynamic";

const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

export default async function GatePage({
  params,
  searchParams,
}: {
  params: Promise<{ gate: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  await requireGateAccess();
  const { gate: slug } = await params;
  const { event: eventId } = await searchParams;
  const gate = findGate(slug);
  if (!gate) notFound();

  // Events of this category that are upcoming or just happened.
  const events = await db.event.findMany({
    where: {
      kind: { equals: gate.kind, mode: "insensitive" },
      startsAt: { gte: new Date(Date.now() - TWO_DAYS) },
    },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true, startsAt: true },
  });
  const selected = events.find((event) => event.id === eventId);

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Gate: {gate.label}</h1>
        <nav aria-label="Choose a gate" className="flex flex-wrap gap-2">
          {GATES.map((item) => (
            <Link
              key={item.slug}
              href={`/gate/${item.slug}`}
              aria-current={item.slug === gate.slug ? "page" : undefined}
              className={item.slug === gate.slug ? "chip chip-active" : "chip"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-2">
          <p className="text-sm font-medium">Which event are you admitting?</p>
          {events.length === 0 ? (
            <p className="text-muted">There are no {gate.label.toLowerCase()} events to admit.</p>
          ) : (
            <nav aria-label="Choose an event" className="flex flex-wrap gap-2">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/gate/${gate.slug}?event=${event.id}`}
                  aria-current={event.id === selected?.id ? "page" : undefined}
                  className={event.id === selected?.id ? "chip chip-active" : "chip"}
                >
                  {event.title} ·{" "}
                  {event.startsAt.toLocaleString("en-GB", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>

      {selected ? (
        <div className="card">
          <GateForm
            key={selected.id}
            gate={{ slug: gate.slug, label: gate.label }}
            event={{ id: selected.id, title: selected.title }}
          />
        </div>
      ) : (
        <p className="text-muted">Choose an event above to start scanning.</p>
      )}
    </section>
  );
}