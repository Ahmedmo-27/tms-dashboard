import { z } from "zod";

export const coachLoginSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{11}$/, "Phone number must be 11 digits"),
  password: z.string().trim().min(1, "Password is required"),
});

export const deductionSchema = z.object({
  reason: z.string().trim().min(5, "Reason must be at least 5 characters"),
  sessionDate: z
    .date({ required_error: "Session date is required" })
    .refine((date) => date <= new Date(), {
      message: "Session date cannot be in the future",
    }),
  sessionType: z.enum(["INDIVIDUAL", "GROUP"], {
    required_error: "Session type is required",
  }),
});

export type CoachLoginFormValues = z.infer<typeof coachLoginSchema>;
export type DeductionFormValues = z.infer<typeof deductionSchema>;
