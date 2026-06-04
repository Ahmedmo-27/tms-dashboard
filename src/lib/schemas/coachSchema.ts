import { z } from "zod";

export const coachSchema = z.object({
  coachName: z.string().trim().min(1, "Name is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
});
