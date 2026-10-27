import { z } from "zod";

export const classSchema = z.object({
  _id: z.string(),
  title: z.string().trim().min(1, "Title is required"),
  price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .regex(/^[0-9]+(\.[0-9]+)?$/, "Price must be a number"),
  category: z.string().trim().min(1, "Category is required"),
  locations: z
    .array(z.string().min(1, "Location value cannot be blank"))
    .min(1, "At least one location is required"),
  defaultDuration: z
    .union([
      z.string().trim().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) > 0), {
        message: "Duration must be a positive number",
      }),
      z.number().positive("Duration must be a positive number"),
    ])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      return Number(val);
    }),
});
