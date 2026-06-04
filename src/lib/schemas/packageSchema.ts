import { z } from "zod";

export const packageSchema = z.object({
  _id: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  price: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, "Price must be a number")
    .min(1, "Price is required"),
  numberOfSessions: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, "Sessions must be a number")
    .min(1, "Sessions is required"),
  expiryPeriod: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, "Expiry Period must be a number")
    .min(1, "Expiry Period is required"),
  category: z.string().trim().min(1, "Category is required"),
  opensClasses: z.array(z.string()),
  classRestrictions: z
    .array(
      z.object({
        cid: z.string(),
        limit: z.coerce.number().int().positive(),
      })
    )
    .optional()
    .default([]),
});
