import { formatInTimeZone } from "date-fns-tz";
import { Payment } from "@/components/ui/payments/columns";
import {
  getOutflowBadgeLabel,
  isOutflowTransaction,
} from "@/lib/utils/parsers/payments-parser";

const TIME_ZONE = "Africa/Cairo";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseAmount(amount: Payment["amount"]): number {
  const numeric =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^0-9.-]+/g, ""))
      : parseFloat(String(amount));
  return isNaN(numeric) ? 0 : numeric;
}

function formatClassTime(classTime: string): string {
  if (!classTime) return "";
  return formatInTimeZone(new Date(classTime), TIME_ZONE, "dd MMM yyyy, hh:mm a");
}

function paymentToRow(payment: Payment): string[] {
  const isOutflow = isOutflowTransaction(payment);
  const amount = parseAmount(payment.amount);

  return [
    payment.memberName ?? "",
    payment.phone ?? "",
    payment.purpose ?? "",
    formatInTimeZone(new Date(payment.paymentTime), TIME_ZONE, "dd MMM yyyy"),
    formatInTimeZone(new Date(payment.paymentTime), TIME_ZONE, "hh:mm a"),
    isOutflow ? `-${Math.abs(amount)}` : String(Math.abs(amount)),
    payment.paymentMethod ?? "",
    payment.location ?? "",
    formatClassTime(payment.classTime),
    isOutflow ? getOutflowBadgeLabel(payment) : "Payment",
    payment.refundReason ?? "",
  ];
}

const EXPORT_HEADERS = [
  "Member Name",
  "Phone",
  "Purpose",
  "Date",
  "Time",
  "Amount (EGP)",
  "Payment Method",
  "Location",
  "Class Time",
  "Transaction Type",
  "Reason",
];

export function buildPaymentsExcelHtml(payments: Payment[]): string {
  const headerRow = EXPORT_HEADERS.map(
    (header) => `<th>${escapeHtml(header)}</th>`
  ).join("");

  const bodyRows = payments
    .map((payment) => {
      const cells = paymentToRow(payment)
        .map((cell) => `<td>${escapeHtml(cell)}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Payments</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table border="1">
<thead><tr>${headerRow}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
</body>
</html>`;
}

export function downloadPaymentsExcel(
  payments: Payment[],
  startDate: string,
  endDate: string
): void {
  const html = buildPaymentsExcelHtml(payments);
  const blob = new Blob(["\uFEFF", html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `payments-${startDate}-to-${endDate}.xls`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke after a tick so mobile browsers can start the download first.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
