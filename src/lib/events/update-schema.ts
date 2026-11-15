import { z } from "zod";
import { EVENT_KINDS } from "./schemas";

const updateTicketTypeSchema = z.object({
  id: z.string().optional(), // existing type; absent = new type
  name: z
    .string()
    .trim()
    .max(100)
    .transform((v) => v || "Regular"),
  price: z.number({ error: "Enter a price." }).int().min(0, { error: "Price cannot be negative." }),
  quantity: z
    .number({ error: "Enter a quantity." })
    .int()
    .min(1, { error: "At least 1 ticket per type." }),
});

export const updateEventSchema = z.object({
  title: z.string().trim().min(1, { error: "Enter a title." }).max(150),
  kind: z.enum(EVENT_KINDS, { error: "Choose bus, concert or conference." }),
  location: z.string().trim().max(150).optional(),
  startsAt: z.coerce.date({ error: "Enter a valid date and time." }),
  ticketTypes: z
    .array(updateTicketTypeSchema)
    .min(1, { error: "Add at least one ticket type." })
    .max(10),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
