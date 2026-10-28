import { requireOrganiser } from "@/lib/auth/session";
import { GateForm } from "./gate-form";

export default async function GatePage() {
  await requireOrganiser();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Gate</h1>
      <p className="text-gray-600">Paste or type a ticket code. A valid scan marks it as used.</p>
      <GateForm />
    </section>
  );
}
