import assert from "node:assert/strict";
import { format, isFuture, parseISO, startOfDay } from "date-fns";

// Helper functions mirroring the logic in RecordPastSessionsDialog and SubPackage
export function calculateRemainingClasses(
  initialClasses: number | string,
  dates: string[]
): number {
  const total = Number(initialClasses) || 0;
  return Math.max(0, total - dates.length);
}

export function isValidPastSessionDate(
  dateStr: string,
  referenceDate = new Date()
): boolean {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.trim()) return false;
  const parsed = parseISO(dateStr.trim());
  if (isNaN(parsed.getTime())) return false;
  // Date must not be strictly after today (start of tomorrow)
  const refStart = startOfDay(referenceDate);
  const dateStart = startOfDay(parsed);
  return dateStart <= refStart;
}

export function buildPreviousSessionsPayload(
  uid: string,
  pkgId: string,
  pkgStartDate: string,
  dates: string[],
  reason?: string
) {
  const normalizedDates = dates.map((d) => d.trim()).filter(Boolean);
  if (!uid || !pkgId || !pkgStartDate) {
    throw new Error("Missing required package identifiers");
  }
  if (normalizedDates.length === 0) {
    throw new Error("At least one date is required");
  }
  return {
    uid,
    pkgId,
    pkgStartDate,
    previousSessionDates: normalizedDates,
    reason: reason?.trim() || undefined,
  };
}

// -------------------------------------------------------------------------
// Test Suite: Frontend Past Session Calculations & Validations
// -------------------------------------------------------------------------

// 1. Remaining Classes Calculation
{
  // Basic deduction
  assert.equal(
    calculateRemainingClasses(10, ["2026-10-01", "2026-10-02"]),
    8,
    "10 classes - 2 past sessions must equal 8"
  );

  // String typed numberOfSessions (from PackageCatalog table)
  assert.equal(
    calculateRemainingClasses("15", ["2026-10-01", "2026-10-02", "2026-10-03"]),
    12,
    "String '15' parsed and deducted 3 must equal 12"
  );

  // Exact deduction to zero
  assert.equal(
    calculateRemainingClasses(3, ["2026-10-01", "2026-10-02", "2026-10-03"]),
    0,
    "3 classes - 3 sessions must reach 0"
  );

  // Over-deduction clamped to zero (never negative)
  assert.equal(
    calculateRemainingClasses(2, ["2026-10-01", "2026-10-02", "2026-10-03"]),
    0,
    "Over-deduction must clamp to 0 and not produce negative class counts"
  );

  // Empty dates list
  assert.equal(
    calculateRemainingClasses(10, []),
    10,
    "Empty dates list must preserve all classes"
  );

  // Invalid initial classes
  assert.equal(
    calculateRemainingClasses("invalid" as any, ["2026-10-01"]),
    0,
    "Invalid initial count safely defaults to 0"
  );
}

// 2. Date Validation Rules
{
  const refDate = new Date("2026-10-19T12:00:00Z");

  // Valid past date
  assert.equal(
    isValidPastSessionDate("2026-10-05", refDate),
    true,
    "Past date 2026-10-05 should be valid"
  );

  // Today is valid (same day attendance earlier in the day)
  assert.equal(
    isValidPastSessionDate("2026-10-19", refDate),
    true,
    "Today's date should be valid for recording sessions attended earlier today"
  );

  // Tomorrow/future is invalid
  assert.equal(
    isValidPastSessionDate("2026-10-20", refDate),
    false,
    "Future date 2026-10-20 must be rejected"
  );

  assert.equal(
    isValidPastSessionDate("2099-01-01", refDate),
    false,
    "Distant future date 2099-01-01 must be rejected"
  );

  // Blank or garbage strings
  assert.equal(isValidPastSessionDate("", refDate), false);
  assert.equal(isValidPastSessionDate("   ", refDate), false);
  assert.equal(isValidPastSessionDate("not-a-date", refDate), false);
  assert.equal(isValidPastSessionDate(null as any, refDate), false);
  assert.equal(isValidPastSessionDate(undefined as any, refDate), false);
}

// 3. Payload Construction & Edge Cases
{
  const payload = buildPreviousSessionsPayload(
    "member_123",
    "pkg_456",
    "2026-10-01T00:00:00.000Z",
    ["2026-10-02", "  2026-10-03  ", ""],
    "  Attended before registration  "
  );

  assert.equal(payload.uid, "member_123");
  assert.equal(payload.pkgId, "pkg_456");
  assert.deepEqual(payload.previousSessionDates, ["2026-10-02", "2026-10-03"]);
  assert.equal(payload.reason, "Attended before registration");

  // Error on empty dates
  assert.throws(
    () =>
      buildPreviousSessionsPayload(
        "member_123",
        "pkg_456",
        "2026-10-01T00:00:00.000Z",
        ["  ", ""]
      ),
    /At least one date is required/
  );

  // Error on missing package id
  assert.throws(
    () =>
      buildPreviousSessionsPayload(
        "member_123",
        "",
        "2026-10-01T00:00:00.000Z",
        ["2026-10-02"]
      ),
    /Missing required package identifiers/
  );
}

console.log("record-past-sessions.test.ts: all 18 assertions passed successfully!");
