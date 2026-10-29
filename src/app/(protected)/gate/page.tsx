import { requireOrganiser } from "@/lib/auth/session";
import { GateForm } from "./gate-form";

export default async function GatePage() {
  await requireOrganiser();

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Gate</h1>
        <p className="text-muted">Paste or type a ticket code. A valid scan marks it as used.</p>
      </div>
      <div className="card">
        <GateForm />
      </div>
    </section>
  );
}
