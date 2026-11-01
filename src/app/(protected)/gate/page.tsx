import Link from "next/link";
import { GATES } from "@/lib/tickets/gates";

// The gate selector: one big link per category.
export default function GatePage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Gate</h1>
        <p className="text-muted">Choose which gate you are staffing.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {GATES.map((gate) => (
          <li key={gate.slug}>
            <Link
              href={`/gate/${gate.slug}`}
              className="card hover:bg-surface-2 focus-visible:outline-focus block text-center text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Gate: {gate.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
