import type { Payment } from "@/components/ui/payments/columns";

/**
 * Builds tab-separated text for pasting at the Name column (column E):
 * Name | Member | Payment | Payment Method | Purpose | Number | ID | On Sheet | On App
 *
 * Rows without a payment amount put the membership/package label in Member.
 * Rows with a payment amount leave Member empty and fill Payment, Method, and Purpose.
 */
function buildPaymentSheetRow(p: Payment): string {
  const name = (p.memberName || "").replace(/\t/g, " ").trim();
  const rawAmount = p.amount
    ? String(p.amount).replace(/[^0-9.-]+/g, "")
    : "";
  const hasPayment = rawAmount !== "" && rawAmount !== "0";

  const member = hasPayment ? "" : (p.purpose || "").replace(/\t/g, " ").trim();
  const amount = hasPayment ? rawAmount : "";
  const method = hasPayment ? (p.paymentMethod || "").replace(/\t/g, " ").trim() : "";
  const purpose = hasPayment
    ? (p.paymentLabel || p.purpose || "").replace(/\t/g, " ").trim()
    : "";

  return [
    name,
    member,
    amount,
    method,
    purpose,
    "",
    "",
    "",
    "",
  ].join("\t");
}

export function buildPaymentsSheetClipboardText(
  payments: Payment[]
): string {
  return payments.map(buildPaymentSheetRow).join("\n");
}
