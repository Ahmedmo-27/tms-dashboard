import { format } from "date-fns";
import {
  SerializableSheetDay,
  formatSheetPhone,
} from "./daily-sheet-csv";

function escapeHtml(value?: string | number | null): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LEFT_HEADERS = [
  "Daily Check In",
  "Name",
  "Member",
  "Payment",
  "Payment Method",
  "Purpose",
  "Number",
  "Status",
  "Notes",
];

const RIGHT_HEADERS = [
  "SPACE/PT",
  "Name",
  "Member",
  "Payment",
  "Payment Method",
  "Purpose",
  "Number",
  "Status",
  "Notes",
];

export interface SheetExportItem {
  day: SerializableSheetDay;
  branchName: string;
}

export function buildSheetDayTableHtml(item: SheetExportItem): string {
  const { day, branchName } = item;
  const [y, m, d] = day.date.split("-");
  const dateObj = new Date(`${day.date}T12:00:00`);
  const formattedDate = !isNaN(dateObj.getTime())
    ? format(dateObj, "EEEE, d MMMM yyyy")
    : day.date;
  const dateLabel = y && m && d ? `${Number(d)}/${Number(m)}` : day.date;

  const leftHeaders = [...LEFT_HEADERS];
  leftHeaders[0] = `Daily Check In ${dateLabel}`;

  // Build left rows (classes)
  const leftRows: Array<{
    isClassHeader?: boolean;
    classTitle?: string;
    coachName?: string;
    cells?: string[];
    isPhone?: boolean[];
    isAmount?: boolean[];
  }> = [];

  for (let i = 0; i < day.classes.length; i++) {
    const block = day.classes[i];
    if (i > 0) {
      // 3 spacing rows between classes
      leftRows.push({ cells: Array(9).fill("") });
      leftRows.push({ cells: Array(9).fill("") });
      leftRows.push({ cells: Array(9).fill("") });
    }

    leftRows.push({
      isClassHeader: true,
      classTitle: block.title,
      coachName: block.coachName,
    });

    let n = 1;
    for (const row of block.rows) {
      if (!row.name.trim()) continue;
      const formattedPhone = formatSheetPhone(row.phone);
      const isPhone = [false, false, false, false, false, false, true, false, false];
      const isAmount = [false, false, false, true, false, false, false, false, false];
      leftRows.push({
        cells: [
          String(n++),
          row.name,
          row.memberLabel || "",
          row.amount != null ? String(row.amount) : "",
          row.paymentMethod || "",
          row.purpose || "",
          formattedPhone,
          row.status || "",
          row.note || "",
        ],
        isPhone,
        isAmount,
      });
    }
  }

  // Build right rows (Space/PT)
  const rightRows: Array<{
    cells?: string[];
    isPhone?: boolean[];
    isAmount?: boolean[];
  }> = [];

  let spaceN = 1;
  for (const row of day.spacePt) {
    if (!row.name.trim()) continue;
    const formattedPhone = formatSheetPhone(row.phone);
    const isPhone = [false, false, false, false, false, false, true, false, false];
    const isAmount = [false, false, false, true, false, false, false, false, false];
    rightRows.push({
      cells: [
        String(spaceN++),
        row.name,
        row.memberLabel || "",
        row.amount != null ? String(row.amount) : "",
        row.paymentMethod || "",
        row.purpose || "",
        formattedPhone,
        row.status || "",
        row.note || "",
      ],
      isPhone,
      isAmount,
    });
  }

  const height = Math.max(leftRows.length, rightRows.length, 1);

  // Table Banner
  let html = `<table border="1" style="border-collapse: collapse; margin-bottom: 24px; font-family: Calibri, Arial, sans-serif; font-size: 11pt;">\n`;
  html += `  <thead>\n`;
  html += `    <tr>\n`;
  html += `      <th colspan="20" style="background-color: #1e3a8a; color: #ffffff; font-size: 14pt; font-weight: bold; padding: 10px; text-align: left;">\n`;
  html += `        Daily Check In &mdash; ${escapeHtml(branchName)} &mdash; ${escapeHtml(formattedDate)}\n`;
  html += `      </th>\n`;
  html += `    </tr>\n`;

  // Headers
  html += `    <tr style="background-color: #2563eb; color: #ffffff; font-weight: bold;">\n`;
  for (const h of leftHeaders) {
    html += `      <th style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center;">${escapeHtml(h)}</th>\n`;
  }
  // 2 gap columns
  html += `      <th style="border: none; background-color: #ffffff; width: 24px;"></th>\n`;
  html += `      <th style="border: none; background-color: #ffffff; width: 24px;"></th>\n`;
  for (const h of RIGHT_HEADERS) {
    html += `      <th style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center; background-color: #0284c7;">${escapeHtml(h)}</th>\n`;
  }
  html += `    </tr>\n`;
  html += `  </thead>\n`;
  html += `  <tbody>\n`;

  for (let i = 0; i < height; i++) {
    const left = leftRows[i];
    const right = rightRows[i];

    html += `    <tr>\n`;

    // Left pane columns
    if (left?.isClassHeader) {
      html += `      <td colspan="4" style="background-color: #e0e7ff; font-weight: bold; color: #1e1b4b; border: 1px solid #94a3b8; padding: 6px 8px;">${escapeHtml(left.classTitle)}</td>\n`;
      html += `      <td colspan="5" style="background-color: #e0e7ff; font-weight: bold; color: #312e81; border: 1px solid #94a3b8; padding: 6px 8px;">${escapeHtml(left.coachName ? `Coach: ${left.coachName}` : "")}</td>\n`;
    } else {
      const cells = left?.cells ?? Array(9).fill("");
      for (let c = 0; c < 9; c++) {
        const val = cells[c] || "";
        const phoneStyle = left?.isPhone?.[c] ? "mso-number-format:'\\@';" : "";
        const amountStyle = left?.isAmount?.[c] && val ? "text-align: right; mso-number-format:'#,##0.00';" : "";
        const centerStyle = c === 0 ? "text-align: center;" : "";
        html += `      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; ${phoneStyle} ${amountStyle} ${centerStyle}">${escapeHtml(val)}</td>\n`;
      }
    }

    // 2 gap columns
    html += `      <td style="border: none; background-color: #ffffff;"></td>\n`;
    html += `      <td style="border: none; background-color: #ffffff;"></td>\n`;

    // Right pane columns
    const rightCells = right?.cells ?? Array(9).fill("");
    for (let c = 0; c < 9; c++) {
      const val = rightCells[c] || "";
      const phoneStyle = right?.isPhone?.[c] ? "mso-number-format:'\\@';" : "";
      const amountStyle = right?.isAmount?.[c] && val ? "text-align: right; mso-number-format:'#,##0.00';" : "";
      const centerStyle = c === 0 ? "text-align: center;" : "";
      html += `      <td style="padding: 4px 6px; border: 1px solid #e2e8f0; ${phoneStyle} ${amountStyle} ${centerStyle}">${escapeHtml(val)}</td>\n`;
    }

    html += `    </tr>\n`;
  }

  html += `  </tbody>\n`;
  html += `</table>\n`;

  return html;
}

export function buildMultipleSheetsExcelHtml(items: SheetExportItem[]): string {
  const tablesHtml = items.map(buildSheetDayTableHtml).join("<br/><br/>\n");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="UTF-8">
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>Daily Sheets</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  th, td { vertical-align: middle; }
</style>
</head>
<body>
${tablesHtml}
</body>
</html>`;
}

export function downloadSheetExcel(
  items: SheetExportItem[],
  startDate: string,
  endDate: string
): void {
  const html = buildMultipleSheetsExcelHtml(items);
  const blob = new Blob(["\uFEFF", html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const filename =
    startDate === endDate && items.length === 1
      ? `daily-sheet-${items[0].branchName.replace(/[\\/:*?"<>|]+/g, " ").trim()}-${startDate}.xls`
      : `daily-sheets-${startDate}-to-${endDate}.xls`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
