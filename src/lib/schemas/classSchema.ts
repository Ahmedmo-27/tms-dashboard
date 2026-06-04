import { z } from "zod";

export const classSchema = z.object({
  _id: z.string(),
  title: z.string().trim().min(1, "Title is required"),
  price: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, "Price must be a number")
    .min(1, "Price is required"),
  category: z.string().trim().min(1, "Category is required"),
  locations: z.array(z.string()).min(1, "At least one location is required"),
});
