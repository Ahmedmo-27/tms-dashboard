import type { Payment } from "@/components/ui/payments/columns";

/**
 * Builds tab-separated text matching the payments sheet format (column N onward):
 * SPACE/PT | Name | Member | Payment | Payment Method | Purpose | Number | ID | On Sheet | On App
 *
 * Rows without a payment amount put the membership/package label in Member.
 * Rows with a payment amount leave Member empty and fill Payment, Method, and Purpose.
 */
export function buildPaymentsSheetClipboardText(
  payments: Payment[]
): string {
  return payments
    .map((p) => {
      const name = p.memberName || "";
      const rawAmount = p.amount
        ? String(p.amount).replace(/[^0-9.-]+/g, "")
        : "";
      const hasPayment = rawAmount !== "" && rawAmount !== "0";

      const member = hasPayment ? "" : p.purpose || "";
      const amount = hasPayment ? rawAmount : "";
      const method = hasPayment ? p.paymentMethod || "" : "";
      const purpose = hasPayment ? p.paymentLabel || p.purpose || "" : "";
      const number = "";
      const id = "";
      const onSheet = "";
      const onApp = "";

      return `\t${name}\t${member}\t${amount}\t${method}\t${purpose}\t${number}\t${id}\t${onSheet}\t${onApp}`;
    })
    .join("\n");
}
