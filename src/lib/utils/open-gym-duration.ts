export type DurationUnit = "weeks" | "months" | "days";

const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;

export function durationToDays(value: number, unit: DurationUnit): number {
  if (!Number.isFinite(value) || value < 1) return 0;
  if (unit === "days") return value;
  return unit === "weeks" ? value * DAYS_PER_WEEK : value * DAYS_PER_MONTH;
}

export function daysToDuration(days: number): {
  value: string;
  unit: DurationUnit;
} {
  const parsedDays = Number(days);
  if (!Number.isFinite(parsedDays) || parsedDays < 1) {
    return { value: "1", unit: "weeks" };
  }

  if (parsedDays % DAYS_PER_MONTH === 0) {
    return {
      value: String(parsedDays / DAYS_PER_MONTH),
      unit: "months",
    };
  }

  if (parsedDays % DAYS_PER_WEEK === 0) {
    return {
      value: String(parsedDays / DAYS_PER_WEEK),
      unit: "weeks",
    };
  }

  return { value: String(parsedDays), unit: "days" };
}

export function formatDurationLabel(
  value: number,
  unit: DurationUnit,
): string {
  const rounded = Number(value);
  if (!Number.isFinite(rounded) || rounded < 1) return "";
  if (unit === "days") {
    return rounded === 1 ? "1 day" : `${rounded} days`;
  }
  const label = unit === "weeks" ? "week" : "month";
  return rounded === 1 ? `1 ${label}` : `${rounded} ${label}s`;
}

export function formatExpiryPeriodLabel(expiryPeriod?: string | number): string {
  const days = Number(expiryPeriod);
  if (!Number.isFinite(days) || days < 1) return "Custom";
  const { value, unit } = daysToDuration(days);
  return formatDurationLabel(Number(value), unit);
}
