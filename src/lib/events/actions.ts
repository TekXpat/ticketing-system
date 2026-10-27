"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganiser } from "@/lib/auth/session";
import { ensureBusLayout } from "./layout";
import { createEventSchema } from "./schemas";

export type CreateEventState = {
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createEvent(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  // Only an organiser may create events. This check is the authoritative one:
  // hiding the link in the header is a convenience, not security.
  await requireOrganiser();

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

  const { title, kind, location, startsAt, capacity, ticketTypes } = parsed.data;

  // Only buses have assigned seats. Concerts and conferences sell a quantity.
  const seated = kind === "bus";
  const seatLayoutId = seated ? await ensureBusLayout(capacity) : undefined;

  await db.event.create({
    data: {
      title,
      kind,
      location,
      startsAt,
      seatLayoutId,
      ticketTypes: {
        create: ticketTypes.map((type) => ({
          name: type.name,
          price: type.price,
          // A bus sells exactly its seats, so the stock always matches the grid.
          quantity: seated ? capacity : type.quantity,
          maxPerCustomer: type.maxPerCustomer ?? undefined,
          seated,
        })),
      },
    },
  });

  redirect("/events");
}
