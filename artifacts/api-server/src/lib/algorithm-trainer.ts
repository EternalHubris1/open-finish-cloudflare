import { z } from "zod/v4";
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Invalid calendar date");
export const trainerId = z
  .string()
  .regex(/^(lc|dojo|custom)-[a-z0-9-]{1,100}$/);
export const trainerWrite = z.object({
  version: z.number().int().min(0),
  state: z.object({
    code: z.string().max(24000),
    notes: z.string().max(6000),
    queued: z.boolean(),
    nextReview: calendarDate.nullable(),
    custom: z
      .object({
        title: z.string().trim().min(1).max(140),
        topic: z.string().trim().min(1).max(80),
        url: z
          .string()
          .max(2000)
          .refine((value) => {
            if (!value) return true;
            try {
              const url = new URL(value);
              return (
                ["http:", "https:"].includes(url.protocol) &&
                !url.username &&
                !url.password
              );
            } catch {
              return false;
            }
          }, "Use an HTTP(S) source link"),
        statement: z.string().max(10000),
        tests: z
          .array(
            z.object({ args: z.array(z.json()).max(20), expected: z.json() }),
          )
          .max(50),
      })
      .optional(),
    attempts: z
      .array(
        z.object({
          id: z.uuid(),
          recordedAt: z.iso.datetime(),
          minutes: z.number().int().min(0).max(1440),
          outcome: z.enum(["independent", "assisted", "retry"]),
          note: z.string().max(600),
        }),
      )
      .max(100)
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "Duplicate attempt",
      ),
  }),
});
