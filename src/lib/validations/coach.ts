import { z } from "zod";

export const coachLoginSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{11}$/, "Phone number must be 11 digits"),
  password: z.string().trim().min(1, "Password is required"),
});

export const deductionSchema = z.object({
  sessionDate: z
    .date({ required_error: "Session date is required" })
    .refine((date) => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date <= today;
    }, {
      message: "Session date cannot be in the future",
    }),
});

export type CoachLoginFormValues = z.infer<typeof coachLoginSchema>;
export type DeductionFormValues = z.infer<typeof deductionSchema>;
