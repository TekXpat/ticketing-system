import { z } from "zod";

// Rules for the edit-event form. Checked on the server before anything is saved.
export const updateEventSchema = z.object({
  title: z.string().trim().min(1, { error: "Enter a title." }).max(150),
  location: z.string().trim().max(150).optional(),
  startsAt: z.coerce.date({ error: "Enter a valid date and time." }),
  ticketTypes: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        name: z.string().trim().min(1, { error: "Every ticket type needs a name." }).max(100),
        price: z
          .number({ error: "Enter a price for every ticket type." })
          .int()
          .min(0, { error: "Price cannot be negative." }),
        quantity: z
          .number({ error: "Enter a quantity for every ticket type." })
          .int()
          .min(1, { error: "Each ticket type needs at least 1 ticket." }),
        maxPerCustomer: z.number().int().min(1).nullish(),
      }),
    )
    .min(1)
    .max(10),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;