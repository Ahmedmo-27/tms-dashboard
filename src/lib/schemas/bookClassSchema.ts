import { z } from "zod";

export const bookClassSchema = z.object({
  uid: z.string().min(1, "Member is required"),
  clsId: z.string().min(1, "Class is required"),
  overrideTimeRestrictions: z
    .enum(["true", "false"])
    .optional()
    .default("false"),
});
