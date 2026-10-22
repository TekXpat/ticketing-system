"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { createEventSchema } from "./schemas";

export type CreateEventState = {
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createEvent(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  // Only a signed-in user may create events.
  await requireUser();

  const raw = Object.fromEntries(formData);
  // An empty box arrives as "", so treat it as "not given".
  for (const key of ["location", "maxPerCustomer", "seatLayoutId"]) {
    if (raw[key] === "") delete raw[key];
  }

  const parsed = createEventSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const {
    title,
    kind,
    location,
    startsAt,
    ticketName,
    price,
    quantity,
    maxPerCustomer,
    seatLayoutId,
  } = parsed.data;

  await db.event.create({
    data: {
      title,
      kind,
      location,
      startsAt,
      seatLayoutId,
      ticketTypes: {
        create: {
          name: ticketName,
          price,
          quantity,
          maxPerCustomer,
          seated: Boolean(seatLayoutId),
        },
      },
    },
  });

  redirect("/events");
}
