import { z } from "zod";

export const nonUserDataSchema = z.object({
  name: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, {
      message:
        "Username must contain first and last names with capitalized initials (e.g., Abdelrahman Tolan)",
    }),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{11}$/, "Invalid Phone Number"),
});

export const newUserSchema = z.object({
  name: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, {
      message:
        "Username must contain first and last names with capitalized initials (e.g., Abdelrahman Tolan)",
    }),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{11}$/, "Invalid Phone Number"),
  password: z.string().trim(),
});

export const nonUserBookingSchema = z.object({
  name: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, {
      message:
        "Username must contain first and last names with capitalized initials (e.g., Abdelrahman Tolan)",
    }),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{11}$/, "Invalid Phone Number"),
  scid: z.string().trim(),
});

export const walkInSchema = z.object({
  name: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, {
      message:
        "Username must contain first and last names with capitalized initials (e.g., Abdelrahman Tolan)",
    }),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{11}$/, "Invalid Phone Number"),
  scid: z.string().trim(),
  paymentMethod: z.string().trim().optional(),
  amount: z.coerce.number().optional(),
  paymentDate: z.string().optional(),
});

export const attendanceSchema = z.object({
  bookingId: z.string().min(24, "Invalid BookingId"),
  paymentMethod: z.string().trim().min(1, "Payment method is required"),
  amount: z.coerce.number().optional(),
  paymentDate: z.string().optional(),
});
