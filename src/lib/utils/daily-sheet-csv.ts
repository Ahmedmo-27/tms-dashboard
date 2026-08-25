export type CsvPersonRow = {
  name: string;
  memberLabel: string;
  amount: number | null;
  amountText?: string;
  paymentMethod: string;
  purpose: string;
  phone: string;
  status?: string;
  note?: string;
};

export type CsvClassSection = {
  title: string;
  coachName: string;
  rows: CsvPersonRow[];
};

export type ParsedDailySheetCsv = {
  headerDate?: string;
  classes: CsvClassSection[];
  spacePt: CsvPersonRow[];
};

export type SerializableSheetDay = {
  date: string;
  classes: Array<{
    title: string;
    coachName: string;
    rows: CsvPersonRow[];
  }>;
  spacePt: CsvPersonRow[];
};

const LEFT_COLS = 9;
const GAP_COLS = 2;

const CLASS_HEADER_KEYWORDS =
  /\b(pilates|strength|yoga|reformer|hiit|spin|barre|circuit|bootcamp|boot camp|cycling|boxing|sculpt|conditioning|mobilize|rope flow|ladies workout|prenatal|postpartum|pre\/post|stretch|hyrox|50\s*&\s*fab|50 and fab)\b/i;

/** Sheet shorthand for a class or category, e.g. "FT 11" or "Cond 7:30". */
const CLASS_HEADER_ABBREVIATIONS =
  /\b(ft|st|ums|pt|sm|og|mat|ref|rf|cond|str|lw|pp)\b/i;

type PaneColumns = {
  name: number;
  member: number;
  payment: number;
  method: number;
  purpose: number;
  number: number;
  status: number;
  notes: number;
  onApp: number;
};

function headerKey(cell: string): string {
  return (cell || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function findHeaderIndex(header: string[], aliases: string[]): number {
  for (let i = 0; i < header.length; i++) {
    if (aliases.includes(headerKey(header[i]))) return i;
  }
  return -1;
}

function detectPaneColumns(header: string[]): PaneColumns {
  const name = findHeaderIndex(header, ["name"]);
  if (name < 0) {
    return {
      name: 1,
      member: 2,
      payment: 3,
      method: 4,
      purpose: 5,
      number: 6,
      status: 7,
      notes: 8,
      onApp: -1,
    };
  }
  const member = findHeaderIndex(header, ["member"]);
  const payment = findHeaderIndex(header, ["payment"]);
  const method = findHeaderIndex(header, ["payment method", "method"]);
  const purpose = findHeaderIndex(header, ["purpose"]);
  const number = findHeaderIndex(header, ["number", "phone"]);
  const status = findHeaderIndex(header, ["status"]);
  const notes = findHeaderIndex(header, ["notes", "note"]);
  const onSheet = findHeaderIndex(header, ["on sheet"]);
  const onApp = findHeaderIndex(header, ["on app"]);
  return {
    name,
    member: member >= 0 ? member : name + 1,
    payment: payment >= 0 ? payment : name + 2,
    method: method >= 0 ? method : name + 3,
    purpose: purpose >= 0 ? purpose : name + 4,
    number: number >= 0 ? number : name + 5,
    status,
    notes: notes >= 0 ? notes : onSheet,
    onApp,
  };
}

export function parseSheetAmount(raw: string): {
  amount: number | null;
  invalid?: string;
} {
  const s = (raw || "").trim();
  if (!s || /^(member|will pay|foc|paid)$/i.test(s)) {
    return { amount: null };
  }
  const withoutParens = s.replace(/\([^)]*\)/g, " ").replace(/%/g, " ");
  if (/\d(?:[\d,]*(?:\.\d+)?)(?:\s*\+\s*|\s+)\d/.test(withoutParens)) {
    return {
      amount: null,
      invalid:
        "Split amounts are not a single check-in payment. Put extra amounts in Notes.",
    };
  }
  if (/\+/.test(s) && /\d/.test(s)) {
    return {
      amount: null,
      invalid:
        "Split amounts are not a single check-in payment. Put extra amounts in Notes.",
    };
  }
  const match = s.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return { amount: null };
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? { amount: n } : { amount: null };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function splitCsv(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => parseCsvLine(line))
    .filter((row) => row.some((cell) => cell.length > 0));
}

export function formatSheetPhone(raw?: unknown): string {
  if (raw == null) return "";
  let s = String(raw).trim();
  if (!s) return "";
  s = s.replace(/^="|^"|"$/g, "").trim().replace(/\.0+$/, "");
  const digits = s.replace(/\D/g, "");
  if (!digits) return s;
  if (digits.length === 10 && digits.startsWith("1")) {
    return `0${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("201")) {
    return `0${digits.slice(2)}`;
  }
  if (digits.length === 11 && digits.startsWith("01")) {
    return digits;
  }
  if (digits.length === 8 || digits.length === 9) {
    return digits.startsWith("0") ? digits : `0${digits}`;
  }
  return digits || s;
}

function csvPhoneCell(phone?: string): string {
  const formatted = formatSheetPhone(phone);
  if (!formatted) return "";
  return `="${formatted}"`;
}

function csvEscape(value: string): string {
  if (value.startsWith('="') && value.endsWith('"')) {
    return value;
  }
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isNumericLabel(raw: string): boolean {
  return /^\d+(\.0+)?$/.test((raw || "").trim());
}

function isPhoneLike(raw: string): boolean {
  const s = (raw || "").trim().replace(/^="|^"|"$/g, "").replace(/\.0+$/, "");
  if (!s) return false;
  if (/^\d{8,}(\.0+)?$/.test(s)) return true;
  const digits = s.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function looksLikeHeaderCell(raw: string): boolean {
  return /^(daily check in|name|member|payment|payment method|purpose|number|id|on sheet|on app|status|notes?|space\/?pt|space \/ pt)$/i.test(
    (raw || "").trim()
  );
}

function looksLikeClassHeader(col0: string): boolean {
  const s = (col0 || "").trim();
  if (!s || isNumericLabel(s) || looksLikeHeaderCell(s)) return false;
  if (/^daily check in/i.test(s)) return false;
  if (/\d{1,2}\s*[:.]\s*\d{2}/.test(s)) return true;
  if (/\b\d{1,2}\s*(am|pm)\b/i.test(s)) return true;
  if (/\b\d{1,2}(am|pm)\b/i.test(s)) return true;
  if (CLASS_HEADER_KEYWORDS.test(s)) return true;
  return /\d/.test(s) && CLASS_HEADER_ABBREVIATIONS.test(s);
}

function isDoneLike(raw: string): boolean {
  return /^(done|id)$/i.test((raw || "").trim());
}

function cellAt(cells: string[], index: number): string {
  if (index < 0) return "";
  return (cells[index] || "").trim();
}

function noteFromCells(cells: string[], cols: PaneColumns): string {
  const direct = cellAt(cells, cols.notes);
  if (direct && !isDoneLike(direct)) return direct;
  const onApp = cellAt(cells, cols.onApp);
  if (onApp && !isDoneLike(onApp)) return onApp;
  const status = cellAt(cells, cols.status);
  if (status && !isDoneLike(status) && !isNumericLabel(status)) return status;
  return "";
}

function skipPlaceholderNote(person: CsvPersonRow): string | undefined {
  if (person.note) return person.note;
  const text = `${person.memberLabel} ${person.purpose}`;
  if (/will\s*(pay|renew|scan)|willpay/i.test(text) || /\binvit|\binv\b/i.test(text)) {
    return (person.memberLabel || person.purpose || "").trim() || undefined;
  }
  return undefined;
}

function personFromCells(
  cells: string[],
  cols: PaneColumns
): CsvPersonRow | null {
  const name = cellAt(cells, cols.name);
  if (!name || looksLikeHeaderCell(name)) {
    return null;
  }
  let memberLabel = cellAt(cells, cols.member);
  let phoneRaw = cellAt(cells, cols.number);
  if (isPhoneLike(memberLabel) && !isPhoneLike(phoneRaw)) {
    phoneRaw = memberLabel;
    memberLabel = "";
  }
  const amountRaw = cellAt(cells, cols.payment);
  const parsedAmount = parseSheetAmount(amountRaw);
  const formattedPhone = formatSheetPhone(phoneRaw);
  const person: CsvPersonRow = {
    name,
    memberLabel,
    amount: parsedAmount.amount,
    amountText: amountRaw || undefined,
    paymentMethod: cellAt(cells, cols.method),
    purpose: cellAt(cells, cols.purpose),
    phone: formattedPhone,
    status: cellAt(cells, cols.status) || undefined,
    note: noteFromCells(cells, cols) || undefined,
  };
  person.note = skipPlaceholderNote(person);
  return person;
}

function findSpaceStart(header: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const v = (header[i] || "").trim().toLowerCase();
    if (v === "space/pt" || v === "space / pt" || v === "space" || v === "open gym") {
      return i;
    }
  }
  return -1;
}

export function parseDailySheetCsv(text: string): ParsedDailySheetCsv {
  const rows = splitCsv(text);
  if (rows.length === 0) {
    return { classes: [], spacePt: [] };
  }

  const header = rows[0];
  const spaceStart = findSpaceStart(header);
  const headerDateMatch = (header[0] || "").match(
    /daily check in\s+(\d{1,2}\/\d{1,2})/i
  );
  const leftHeader =
    spaceStart >= 0 ? header.slice(0, spaceStart) : header;
  const rightHeader = spaceStart >= 0 ? header.slice(spaceStart) : [];
  const leftCols = detectPaneColumns(leftHeader);
  const rightCols = detectPaneColumns(rightHeader);

  const classes: CsvClassSection[] = [];
  const spacePt: CsvPersonRow[] = [];
  let current: CsvClassSection | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const left =
      spaceStart >= 0 ? row.slice(0, spaceStart) : row.slice(0, LEFT_COLS);
    const col0 = (left[0] || "").trim();

    if (looksLikeClassHeader(col0)) {
      current = {
        title: col0,
        coachName:
          left
            .slice(1, 7)
            .map((c) => (c || "").trim())
            .find(Boolean) || "",
        rows: [],
      };
      classes.push(current);
    } else if (current && (isNumericLabel(col0) || (left[1] || "").trim())) {
      const person = personFromCells(left, leftCols);
      if (person) current.rows.push(person);
    }

    if (spaceStart >= 0) {
      const right = row.slice(spaceStart);
      const r0 = (right[0] || "").trim();
      const r1 = (right[rightCols.name] || right[1] || "").trim();
      if (!r1 || looksLikeHeaderCell(r1) || looksLikeHeaderCell(r0)) continue;
      if (!isNumericLabel(r0) && r0 && !isNumericLabel(r1)) continue;
      const person = personFromCells(right, rightCols);
      if (person) spacePt.push(person);
    }
  }

  return {
    headerDate: headerDateMatch?.[1],
    classes,
    spacePt,
  };
}

function toCsvPerson(
  row: Partial<CsvPersonRow> & { name?: string }
): CsvPersonRow {
  return {
    name: (row.name || "").trim(),
    memberLabel: row.memberLabel || "",
    amount: row.amount ?? null,
    amountText: row.amountText,
    paymentMethod: row.paymentMethod || "",
    purpose: row.purpose || "",
    phone: formatSheetPhone(row.phone),
    status: row.status,
    note: row.note,
  };
}

export function toSerializableSheetDay(day: {
  date: string;
  classes: Array<{
    title: string;
    coachName?: string;
    rows: Array<Partial<CsvPersonRow> & { name?: string }>;
  }>;
  spacePt: Array<Partial<CsvPersonRow> & { name?: string }>;
}): SerializableSheetDay {
  return {
    date: day.date,
    classes: day.classes.map((block) => ({
      title: block.title,
      coachName: block.coachName || "",
      rows: block.rows.map(toCsvPerson).filter((row) => row.name),
    })),
    spacePt: day.spacePt.map(toCsvPerson).filter((row) => row.name),
  };
}

export function serializeDailySheetCsv(day: SerializableSheetDay): string {
  const [y, m, d] = day.date.split("-");
  const dateLabel =
    y && m && d ? `${Number(d)}/${Number(m)}` : day.date;

  const leftHeader = [
    `Daily Check In ${dateLabel}`,
    "Name",
    "Member",
    "Payment",
    "Payment Method",
    "Purpose",
    "Number",
    "Status",
    "Notes",
  ];
  const rightHeader = [
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

  const leftRows: string[][] = [];
  for (let i = 0; i < day.classes.length; i++) {
    const block = day.classes[i];
    if (i > 0) {
      // 3 empty rows separating each class from the other
      leftRows.push(Array(LEFT_COLS).fill(""));
      leftRows.push(Array(LEFT_COLS).fill(""));
      leftRows.push(Array(LEFT_COLS).fill(""));
    }
    // Coach name centered across the columns from Name (Col 1) to Number (Col 6)
    leftRows.push([block.title, "", "", block.coachName, "", "", "", "", ""]);
    let n = 1;
    for (const row of block.rows) {
      if (!row.name.trim()) continue;
      leftRows.push([
        String(n++),
        row.name,
        row.memberLabel || "",
        row.amount != null ? String(row.amount) : "",
        row.paymentMethod || "",
        row.purpose || "",
        csvPhoneCell(row.phone),
        row.status || "",
        row.note || "",
      ]);
    }
  }

  const rightRows: string[][] = [];
  let spaceN = 1;
  for (const row of day.spacePt) {
    if (!row.name.trim()) continue;
    rightRows.push([
      String(spaceN++),
      row.name,
      row.memberLabel || "",
      row.amount != null ? String(row.amount) : "",
      row.paymentMethod || "",
      row.purpose || "",
      csvPhoneCell(row.phone),
      row.status || "",
      row.note || "",
    ]);
  }

  const height = Math.max(leftRows.length, rightRows.length, 1);
  const lines = [ [...leftHeader, ...Array(GAP_COLS).fill(""), ...rightHeader] ];

  for (let i = 0; i < height; i++) {
    const left = leftRows[i] ?? Array(LEFT_COLS).fill("");
    const right = rightRows[i] ?? Array(LEFT_COLS).fill("");
    while (left.length < LEFT_COLS) left.push("");
    while (right.length < LEFT_COLS) right.push("");
    lines.push([...left, ...Array(GAP_COLS).fill(""), ...right]);
  }

  return "\uFEFF" + lines.map((cols) => cols.map(csvEscape).join(",")).join("\r\n") + "\r\n";
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function parseSheetCsvFilenameDate(filename: string): string | undefined {
  const base = filename.replace(/\.[^.]+$/, "");
  const yearMatch = base.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : undefined;
  const dmy = base.match(/\b(\d{1,2})[\/_\-](\d{1,2})\b/);
  if (dmy && year) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  const monthName = base.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i
  );
  if (monthName && dmy && year) {
    const month = MONTHS[monthName[1].toLowerCase()];
    const day = Number(dmy[1]);
    if (month && day) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return undefined;
}

/**
 * The CSV header only carries day/month ("Daily Check In 30/7"), so the year
 * comes from whichever date the sheet page is already showing.
 */
export function sheetCsvHeaderDateToIso(
  headerDate: string | undefined,
  fallbackYear: number
): string | undefined {
  const match = (headerDate || "").match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return `${fallbackYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dailySheetCsvFilename(
  date: string,
  branchName?: string
): string {
  const dt = new Date(`${date}T12:00:00`);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthYear = `${months[dt.getMonth()]} ${dt.getFullYear()}`;
  const dayPart = `${days[dt.getDay()]} ${dt.getDate()}_${dt.getMonth() + 1}`;
  const branch = branchName ? ` - ${branchName.replace(/[\\/:*?"<>|]+/g, " ").trim()}` : "";
  return `DAILY CHECK INS - ${monthYear} - ${dayPart}${branch}.csv`;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function buildUncompressedZip(
  files: Array<{ name: string; content: string }>
): Blob {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name.replace(/\\/g, "/"));
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data,
    ]);
    locals.push(local);
    centrals.push(
      concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes,
      ])
    );
    offset += local.length;
  }

  const central = concat(centrals);
  const eocd = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);

  return new Blob([concat([...locals, central, eocd])], {
    type: "application/zip",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
