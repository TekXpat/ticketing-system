"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganiser } from "@/lib/auth/session";
import { updateEventForOrganiser, deleteEventForOrganiser } from "./edit";
import { updateEventSchema } from "./update-schema";

export type EditEventState = {
  fieldErrors?: Record<string, string[] | undefined>;
  error?: string;
};

export async function editEvent(
  eventId: string,
  _prev: EditEventState,
  formData: FormData,
): Promise<EditEventState> {
  const organiser = await requireOrganiser();

  const raw: Record<string, unknown> = Object.fromEntries(formData);
  if (raw.location === "") delete raw.location;

  try {
    raw.ticketTypes = JSON.parse(String(raw.ticketTypes ?? "[]"));
  } catch {
    return { fieldErrors: { ticketTypes: ["Could not read ticket types."] } };
  }

  const parsed = updateEventSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updateEventForOrganiser(organiser.id, eventId, parsed.data);
  if (!result.ok) return { error: result.error };

  redirect("/dashboard");
}

export async function removeEvent(eventId: string): Promise<EditEventState> {
  const organiser = await requireOrganiser();
  const result = await deleteEventForOrganiser(organiser.id, eventId);
  if (!result.ok) return { error: result.error };
  redirect("/dashboard");
}
