import { z } from "zod";

export const scheduledClassSchema = z.object({
  clsId: z.string().trim().min(1, "Choose class"),
  startTime: z.string().min(1, "Choose start Time").refine((date) => new Date(date) > new Date(new Date().toLocaleDateString()), "Start time must be in the future"),
  endTime:  z.string().min(1, "Choose end Time"),
  coachId: z.string().trim().min(1, "Choose coach"),
  availableSlots: z.number().min(1, "Enter available slots")
}).superRefine((data, ctx) => {
  if (new Date(data.endTime) < new Date(data.startTime)) {
    ctx.addIssue({
      code: "custom",
      message: "End time must be after start time",
      path: ["endTime"],
    });
  }
});
