import { z } from "zod";

// Rules for placing an order. Checked on the server before anything is saved.
export const createOrderSchema = z.object({
  eventId: z.string().trim().min(1, { error: "Choose an event." }),
  // Mobile money number: digits only.
  phone: z
    .string()
    .trim()
    .regex(/^\d{9,12}$/, { error: "Phone must be 9 to 12 digits." }),
  items: z
    .array(
      z
        .object({
          ticketTypeId: z.string().trim().min(1, { error: "Choose a ticket type." }),
          // General admission: how many. Seated: which seats. Never both.
          quantity: z.number().int().min(1).max(20).optional(),
          seatIds: z.array(z.string().trim().min(1)).min(1).max(20).optional(),
          // One name per ticket, in the same order as the seats or the quantity.
          holderNames: z
            .array(z.string().trim().min(1, { error: "Enter a name for every ticket." }).max(100))
            .max(20)
            .optional(),
        })
        .refine((item) => (item.quantity === undefined) !== (item.seatIds === undefined), {
          error: "Give either a quantity or seat ids, not both.",
        }),
    )
    .min(1, { error: "Add at least one ticket." }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
