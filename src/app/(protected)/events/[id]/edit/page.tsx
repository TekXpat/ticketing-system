import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganiser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { EditForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireOrganiser();
  const { id } = await params;
  const { error } = await searchParams;

  // Only the organiser who created the event can edit it.
  const event = await db.event.findFirst({
    where: { id, organiserId: user.id },
    include: { ticketTypes: { orderBy: { price: "desc" } } },
  });
  if (!event) notFound();

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <Link href="/events" className="nav-link">
        ← Back to tickets
      </Link>
      <h1 className="text-3xl font-bold">Edit event</h1>
      {error ? (
        <p role="alert" className="alert-error">
          {error}
        </p>
      ) : null}
      <EditForm
        event={{
          id: event.id,
          title: event.title,
          location: event.location ?? "",
          startsAt: event.startsAt.toISOString().slice(0, 16),
          types: event.ticketTypes.map((type) => ({
            id: type.id,
            name: type.name,
            price: type.price,
            quantity: type.quantity,
            maxPerCustomer: type.maxPerCustomer,
            seated: type.seated,
          })),
        }}
      />
    </section>
  );
}