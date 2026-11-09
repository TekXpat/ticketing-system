import { z } from "zod";

export const EVENT_KINDS = ["bus", "concert", "conference"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

// A bus seat grid has one button per seat, so keep it a sensible size.
export const MAX_BUS_SEATS = 100;

const ticketTypeSchema = z.object({
  // A blank name means "no special tier": everyone pays the same, so Regular.
  name: z
    .string()
    .trim()
    .max(100)
    .transform((value) => value || "Regular"),
  price: z
    .number({ error: "Enter a price for every ticket type." })
    .int()
    .min(0, { error: "Price cannot be negative." }),
  quantity: z
    .number({ error: "Enter a quantity for every ticket type." })
    .int()
    .min(1, { error: "Each ticket type needs at least 1 ticket." }),
  maxPerCustomer: z.number().int().min(1).nullish(),
});

// Rules for the create-event form. Checked on the server before anything is saved.
export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, { error: "Enter a title." }).max(150),
    kind: z.enum(EVENT_KINDS, { error: "Choose bus, concert or conference." }),
    location: z.string().trim().max(150).optional(),
    startsAt: z.coerce.date({ error: "Enter a valid date and time." }),
    capacity: z.coerce
      .number({ error: "Enter how many seats or tickets are available." })
      .int()
      .min(1, { error: "Capacity must be at least 1." })
      .max(100000),
    ticketTypes: z
      .array(ticketTypeSchema)
      .min(1, { error: "Add at least one ticket type." })
      .max(10, { error: "At most 10 ticket types." }),
  })
  .superRefine((event, ctx) => {
    if (event.kind === "bus") {
      if (event.capacity > MAX_BUS_SEATS) {
        ctx.addIssue({
          code: "custom",
          path: ["capacity"],
          message: `A bus can have at most ${MAX_BUS_SEATS} seats.`,
        });
      }
      if (event.ticketTypes.length > 1) {
        ctx.addIssue({
          code: "custom",
          path: ["ticketTypes"],
          message: "A bus has one ticket type for now.",
        });
      }
      return;
    }

    const total = event.ticketTypes.reduce((sum, type) => sum + type.quantity, 0);
    if (total > event.capacity) {
      ctx.addIssue({
        code: "custom",
        path: ["ticketTypes"],
        message: `Ticket types add up to ${total}, but the capacity is ${event.capacity}.`,
      });
    }
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
