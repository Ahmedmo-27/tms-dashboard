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
  password: z
    .string()
    .trim()
    .min(10, "Password must be at least 10 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  nationalId: z
    .string()
    .trim()
    .refine((val) => !val || /^[a-zA-Z0-9]{6,20}$/.test(val.replace(/[\s\-]/g, "")), {
      message: "National ID must be 6-20 alphanumeric characters",
    })
    .optional()
    .or(z.literal("")),
});

export const editMemberSchema = z.object({
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
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  nationalId: z
    .string()
    .trim()
    .refine((val) => !val || /^[a-zA-Z0-9]{6,20}$/.test(val.replace(/[\s\-]/g, "")), {
      message: "National ID must be 6-20 alphanumeric characters",
    })
    .optional()
    .or(z.literal("")),
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
    .regex(/^[0-9]{11}$/, "Invalid Phone Number")
    .optional()
    .or(z.literal("")),
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
  uid: z.string().optional(),
  pkgId: z.string().optional(),
  phoneNumber: z.string().optional(),
});
