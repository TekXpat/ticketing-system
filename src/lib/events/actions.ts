"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/auth/session";
import { ensureSeatLayout } from "./layout";
import { createEventSchema, isSeatedKind } from "./schemas";

export type CreateEventState = {
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createEvent(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  // Only an organiser may create events. This check is the authoritative one:
  // hiding the link in the header is a convenience, not security.
  const organiser = await requireOrganiser();

  const raw: Record<string, unknown> = Object.fromEntries(formData);
  // An empty box arrives as "", so treat it as "not given".
  if (raw.location === "") delete raw.location;

  // The ticket types arrive as one JSON string, because there can be several.
  try {
    raw.ticketTypes = JSON.parse(String(raw.ticketTypes ?? "[]"));
  } catch {
    return { fieldErrors: { ticketTypes: ["The ticket types could not be read."] } };
  }

  const parsed = createEventSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { title, kind, location, startsAt, ticketTypes } = parsed.data;

  // Buses, flights and theatres have assigned seats. Each ticket type owns the
  // group of seats with its name (a single type owns all of them, as "main").
  const single = ticketTypes.length === 1;
  const sectionOf = (name: string) => (single ? "main" : name);

  let seatLayoutId: string | undefined;
  if (isSeatedKind(kind)) {
    seatLayoutId = await ensureSeatLayout(
      kind,
      ticketTypes.map((type) => ({ name: sectionOf(type.name), count: type.quantity })),
    );
  }

  await db.event.create({
    data: {
      title,
      kind,
      location,
      startsAt,
      seatLayoutId,
      organiserId: organiser.id,
      ticketTypes: {
        create: ticketTypes.map((type) => ({
          name: type.name,
          price: type.price,
          quantity: type.quantity,
          maxPerCustomer: type.maxPerCustomer ?? undefined,
          seated: seatLayoutId !== undefined,
          section: seatLayoutId !== undefined ? sectionOf(type.name) : undefined,
        })),
      },
    },
  });

  redirect("/events");
}
