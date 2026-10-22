import { z } from "zod";

// Rules for the create-event form. Checked on the server before anything is saved.
export const createEventSchema = z.object({
  title: z.string().trim().min(1, { error: "Enter a title." }).max(150),
  kind: z.string().trim().min(1, { error: "Enter a kind, for example concert or bus." }).max(50),
  location: z.string().trim().max(150).optional(),
  startsAt: z.coerce.date({ error: "Enter a valid date and time." }),
  ticketName: z.string().trim().min(1, { error: "Enter a ticket type name." }).max(100),
  price: z.coerce.number().int().min(0, { error: "Price cannot be negative." }),
  quantity: z.coerce.number().int().min(1, { error: "Enter at least 1 ticket." }),
  maxPerCustomer: z.coerce.number().int().min(1).optional(),
  seatLayoutId: z.string().trim().min(1).optional(),
});
