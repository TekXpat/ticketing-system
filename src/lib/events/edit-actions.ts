"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganiser } from "@/lib/auth/session";
import { deleteEventForOrganiser, updateEventForOrganiser } from "./edit";
import { updateEventSchema } from "./update-schema";

export type EditEventState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function updateEvent(
  _prev: EditEventState,
  formData: FormData,
): Promise<EditEventState> {
  const organiser = await requireOrganiser();
  const eventId = String(formData.get("eventId") ?? "");

  const raw: Record<string, unknown> = Object.fromEntries(formData);
  if (raw.location === "") delete raw.location;
  try {
    raw.ticketTypes = JSON.parse(String(raw.ticketTypes ?? "[]"));
  } catch {
    return { error: "The ticket types could not be read." };
  }

  const parsed = updateEventSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const result = await updateEventForOrganiser(organiser.id, eventId, parsed.data);
  if (!result.ok) return { error: result.error };

  redirect("/events");
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const organiser = await requireOrganiser();
  const eventId = String(formData.get("eventId") ?? "");

  const result = await deleteEventForOrganiser(organiser.id, eventId);
  if (!result.ok) {
    redirect(`/events/${eventId}/edit?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/events");
}
