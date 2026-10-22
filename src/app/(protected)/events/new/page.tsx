import { db } from "@/lib/db";
import EventForm from "./event-form";

// Always read the layouts fresh, so a newly created layout shows up.
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const layouts = await db.seatLayout.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <EventForm layouts={layouts} />;
}
