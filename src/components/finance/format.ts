import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const CAIRO_TZ = "Africa/Cairo";

const moneyFormatter = new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value < 0 ? "-" : "";
  return `${sign}EGP ${moneyFormatter.format(Math.abs(Math.round(value)))}`;
}

export function formatCompactMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}EGP ${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${sign}EGP ${(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}K`;
  return formatMoney(value);
}

/** Axis ticks: short, no currency prefix. */
export function formatAxisNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(value));
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormatter.format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits).replace(/\.0$/, "")}%`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return formatInTimeZone(new Date(value), CAIRO_TZ, "dd MMM yyyy, HH:mm");
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return formatInTimeZone(new Date(value), CAIRO_TZ, "dd MMM yyyy");
}

/** Bucket keys are yyyy-MM-dd (daily) or yyyy-MM (monthly). */
export function formatBucket(bucket: string, long = false): string {
  if (/^\d{4}-\d{2}$/.test(bucket)) {
    return format(parseISO(`${bucket}-01`), long ? "MMMM yyyy" : "MMM yy");
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(bucket)) {
    return format(parseISO(bucket), long ? "EEE dd MMM yyyy" : "dd MMM");
  }
  return bucket;
}

export function formatRangeLabel(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return "";
  const s = parseISO(startDate);
  const e = parseISO(endDate);
  if (startDate === endDate) return format(s, "dd MMM yyyy");
  return `${format(s, "dd MMM yyyy")} – ${format(e, "dd MMM yyyy")}`;
}
