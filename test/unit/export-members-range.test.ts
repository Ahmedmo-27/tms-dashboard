import { describe, expect, it } from "vitest";

/**
 * Mirrors the Cairo calendar-day range check used by getMembersForExport.
 * Kept in sync with src/lib/data/member.ts isCreatedInRange.
 */
function isCreatedInRange(
  createdAt: string,
  startDate: string,
  endDate: string
): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;

  const key = createdAt.includes("T")
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(created)
    : createdAt.slice(0, 10);

  return key >= startDate && key <= endDate;
}

describe("member export date range filter", () => {
  it("includes members created on the boundary days in Cairo", () => {
    // 2026-02-28T22:00Z == 2026-03-01 00:00 Africa/Cairo
    expect(
      isCreatedInRange("2026-02-28T22:00:00.000Z", "2026-03-01", "2026-03-31")
    ).toBe(true);
    // Still March 31 evening in Cairo (UTC+2)
    expect(
      isCreatedInRange("2026-03-31T20:00:00.000Z", "2026-03-01", "2026-03-31")
    ).toBe(true);
  });

  it("excludes members outside the selected period", () => {
    // 2026-02-28T21:00Z == 2026-02-28 23:00 Africa/Cairo
    expect(
      isCreatedInRange("2026-02-28T21:00:00.000Z", "2026-03-01", "2026-03-31")
    ).toBe(false);
    // 2026-03-31T22:00Z == 2026-04-01 00:00 Africa/Cairo
    expect(
      isCreatedInRange("2026-03-31T22:00:00.000Z", "2026-03-01", "2026-03-31")
    ).toBe(false);
  });
});
