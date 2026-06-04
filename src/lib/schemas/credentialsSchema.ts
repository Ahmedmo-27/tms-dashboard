import { z } from "zod";

export const credentialsSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{11}$/, "Invalid Phone Number"),
  password: z.string()
  .trim()
});
