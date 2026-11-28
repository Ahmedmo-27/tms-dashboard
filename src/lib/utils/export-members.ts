import { formatInTimeZone } from "date-fns-tz";

export type ExportableMember = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nationalId?: string;
  createdAt: string;
};

const TIME_ZONE = "Africa/Cairo";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCreatedAt(createdAt: string): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return formatInTimeZone(date, TIME_ZONE, "dd MMM yyyy, hh:mm a");
}

function memberToRow(member: ExportableMember): string[] {
  return [
    member.name ?? "",
    member.phone ?? "",
    member.nationalId ?? "",
    member.email ?? "",
    formatCreatedAt(member.createdAt),
  ];
}

const EXPORT_HEADERS = [
  "Member Name",
  "Phone",
  "National ID",
  "Email",
  "Created At",
];

export function buildMembersExcelHtml(members: ExportableMember[]): string {
  const headerRow = EXPORT_HEADERS.map(
    (header) => `<th>${escapeHtml(header)}</th>`
  ).join("");

  const bodyRows = members
    .map((member) => {
      const cells = memberToRow(member)
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
<x:Name>Members</x:Name>
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

export function downloadMembersExcel(
  members: ExportableMember[],
  startDate: string,
  endDate: string
): void {
  const html = buildMembersExcelHtml(members);
  const blob = new Blob(["\uFEFF", html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `members-with-id-${startDate}-to-${endDate}.xls`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke after a tick so mobile browsers can start the download first.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
