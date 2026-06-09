import { z } from "zod";

const amountSchema = z
  .number({ invalid_type_error: "Amount must be a number" })
  .refine((val) => !Number.isNaN(val), "Amount must be a number")
  .refine((val) => val > 0, "Amount must be greater than 0");

export const memberRefundSchema = z.object({
  memberName: z.string().min(1, "Member name is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  amount: amountSchema,
});

export const cashOutSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  amount: amountSchema,
});

export type MemberRefundFormValues = z.infer<typeof memberRefundSchema>;
export type CashOutFormValues = z.infer<typeof cashOutSchema>;

export interface MemberSearchResultDto {
  _id: string;
  name: string;
  phoneNumber: string;
}

export type MemberRecentPaymentPurpose =
  | "DROPIN"
  | "PACKAGE"
  | "WALKIN"
  | "NON_USER_BOOKING"
  | "NON_USER_PACKAGE"
  | "OTHER";

export interface MemberRecentPayment {
  _id: string;
  amount: number;
  paymentMethod: string;
  paymentTime: string;
  purpose: MemberRecentPaymentPurpose;
  itemName: string;
  label: string;
  isRefunded: boolean;
}
