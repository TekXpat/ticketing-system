import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGateAccess } from "@/lib/auth/session";
import { GATES, findGate } from "@/lib/tickets/gates";
import { GateForm } from "../gate-form";

export default async function GatePage({ params }: { params: Promise<{ gate: string }> }) {
  await requireGateAccess();
  const { gate: slug } = await params;
  const gate = findGate(slug);
  if (!gate) notFound();

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
        <p className="text-muted">
          Paste or type a ticket code. Only {gate.label.toLowerCase()} tickets are let in here, and
          a valid scan marks the ticket as used.
        </p>
      </div>
      <div className="card">
        <GateForm key={gate.slug} gate={{ slug: gate.slug, label: gate.label }} />
      </div>
    </section>
  );
}
