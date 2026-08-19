import type { Payment } from "@/components/ui/payments/columns";

/**
 * Builds tab-separated text matching the payments sheet format:
 * SPACE/PT | Name | Member | Payment | Payment Method | Purpose | Number | ID | On Sheet | On App
 */
export function buildPaymentsSheetClipboardText(
  payments: Payment[]
): string {
  return payments
    .map((p) => {
      const name = p.memberName || "";
      const member = p.purpose || "";
      const rawAmount = p.amount ? String(p.amount).replace(/[^0-9.-]+/g, "") : "";
      const hasPayment = rawAmount !== "" && rawAmount !== "0";
      const amount = hasPayment ? rawAmount : "";
      const method = hasPayment ? (p.paymentMethod || "") : "";
      const purpose = hasPayment ? (p.paymentLabel || "") : "";
      const number = "";
      const id = "";
      const onSheet = hasPayment ? "Done" : "";
      const onApp = "";

      return `\t${name}\t${member}\t${amount}\t${method}\t${purpose}\t${number}\t${id}\t${onSheet}\t${onApp}`;
    })
    .join("\n");
}
