import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/auth/session";
import { EditForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organiser = await requireOrganiser();

  const event = await db.event.findUnique({
    where: { id },
    include: { ticketTypes: { orderBy: { price: "desc" } } },
  });

  if (!event) notFound();
  if (event.organiserId !== organiser.id) notFound();

  return (
    <section className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link href="/dashboard" className="nav-link text-sm">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Edit Event</h1>
        <p className="text-muted text-sm">{event.title}</p>
      </div>

      <EditForm
        eventId={event.id}
        defaultValues={{
          title: event.title,
          kind: event.kind,
          location: event.location ?? "",
          startsAt: event.startsAt.toISOString().slice(0, 16),
          ticketTypes: event.ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            price: t.price,
            quantity: t.quantity,
            seated: t.seated,
          })),
        }}
      />
    </section>
  );
}
