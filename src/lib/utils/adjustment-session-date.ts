import { format } from "date-fns";
import type { AdjustmentRecord } from "@/components/ui/members/columns";

const CANCEL_SOURCES = new Set<AdjustmentRecord["source"]>([
  "MEMBER_CANCELLATION",
  "FRONTDESK_CANCELLATION",
]);

const BOOKING_LIKE_SOURCES = new Set<AdjustmentRecord["source"]>([
  "BOOKING",
  "ATTENDANCE",
  "PT_ATTENDANCE",
  "SPACE_WALK",
]);

/** Normalize class labels so "Cancelled: Power Flow" matches "Power Flow". */
export function normalizeAdjustmentClassKey(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/^cancelled:\s*/i, "")
    .replace(/^canceled:\s*/i, "")
    .trim()
    .toLowerCase();
}

function toIsoIfValid(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const d = new Date(value as string | number | Date);
  if (isNaN(d.getTime())) return undefined;
  return typeof value === "string" ? value : d.toISOString();
}

/**
 * Resolve the session/class date from common backend field names.
 * Booking deductions typically use attendanceDate; manual adjusts / some
 * cancellations use sessionDate.
 */
export function resolveAdjustmentSessionDate(adj: {
  attendanceDate?: unknown;
  sessionDate?: unknown;
  classDate?: unknown;
  classTime?: unknown;
}): string | undefined {
  return (
    toIsoIfValid(adj.attendanceDate) ??
    toIsoIfValid(adj.sessionDate) ??
    toIsoIfValid(adj.classDate) ??
    toIsoIfValid(adj.classTime)
  );
}

function sameCalendarDay(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
  return format(da, "yyyy-MM-dd") === format(db, "yyyy-MM-dd");
}

/**
 * For cancel/refund (+Add) rows that have no session date, copy the session
 * date from a related booking/attendance deduction with the same class label.
 */
export function enrichCancellationSessionDates(
  records: AdjustmentRecord[]
): AdjustmentRecord[] {
  const bookingSessions = records.filter(
    (rec) =>
      rec.type === "DEDUCT" &&
      BOOKING_LIKE_SOURCES.has(rec.source) &&
      Boolean(rec.attendanceDate)
  );

  if (bookingSessions.length === 0) return records;

  const usedBookingIndexes = new Set<number>();

  return records.map((rec) => {
    if (rec.type !== "ADD" || !CANCEL_SOURCES.has(rec.source)) return rec;
    // Only fill when the cancel/refund row has no session date of its own.
    if (rec.attendanceDate) return rec;

    const key =
      normalizeAdjustmentClassKey(rec.className) ||
      normalizeAdjustmentClassKey(rec.reason);
    if (!key) return rec;

    const cancelMs = new Date(rec.date).getTime();
    let bestIdx = -1;
    let bestScore = Number.POSITIVE_INFINITY;

    bookingSessions.forEach((booking, idx) => {
      if (usedBookingIndexes.has(idx)) return;
      const bookingKey =
        normalizeAdjustmentClassKey(booking.className) ||
        normalizeAdjustmentClassKey(booking.reason);
      if (bookingKey !== key || !booking.attendanceDate) return;
      if (sameCalendarDay(booking.attendanceDate, rec.date)) return;

      const sessionMs = new Date(booking.attendanceDate).getTime();
      if (isNaN(sessionMs) || isNaN(cancelMs)) return;

      // Prefer upcoming sessions that were cancelled, then closest in time.
      const futurePenalty = sessionMs >= cancelMs ? 0 : 1_000_000_000_000;
      const score = futurePenalty + Math.abs(sessionMs - cancelMs);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    if (bestIdx < 0) return rec;
    usedBookingIndexes.add(bestIdx);
    return {
      ...rec,
      attendanceDate: bookingSessions[bestIdx].attendanceDate,
    };
  });
}

export function getAdjustmentDisplayDates(rec: {
  date?: string;
  attendanceDate?: string;
}): {
  txDate: string | undefined;
  sessionDate: string | undefined;
  showSessionSubtext: boolean;
} {
  const txDate = rec.date ?? rec.attendanceDate;
  const sessionDate = rec.attendanceDate;
  const showSessionSubtext = Boolean(
    sessionDate &&
      txDate &&
      !isNaN(new Date(sessionDate).getTime()) &&
      !isNaN(new Date(txDate).getTime()) &&
      format(new Date(sessionDate), "yyyy-MM-dd") !==
        format(new Date(txDate), "yyyy-MM-dd")
  );
  return { txDate, sessionDate, showSessionSubtext };
}
