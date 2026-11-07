import { describe, expect, it } from "vitest";
import type { AdjustmentRecord } from "@/components/ui/members/columns";
import {
  enrichCancellationSessionDates,
  getAdjustmentDisplayDates,
  normalizeAdjustmentClassKey,
  resolveAdjustmentSessionDate,
} from "@/lib/utils/adjustment-session-date";

describe("normalizeAdjustmentClassKey", () => {
  it("strips cancelled prefixes", () => {
    expect(normalizeAdjustmentClassKey("Cancelled: Power Flow")).toBe(
      "power flow"
    );
    expect(normalizeAdjustmentClassKey("Canceled: Elevate")).toBe("elevate");
  });
});

describe("resolveAdjustmentSessionDate", () => {
  it("prefers attendanceDate then sessionDate", () => {
    expect(
      resolveAdjustmentSessionDate({
        attendanceDate: "2026-11-04T10:00:00.000Z",
        sessionDate: "2026-11-01T10:00:00.000Z",
      })
    ).toBe("2026-11-04T10:00:00.000Z");

    expect(
      resolveAdjustmentSessionDate({
        sessionDate: "2026-11-02T08:00:00.000Z",
      })
    ).toBe("2026-11-02T08:00:00.000Z");
  });

  it("ignores empty values", () => {
    expect(
      resolveAdjustmentSessionDate({
        attendanceDate: "",
        sessionDate: "2026-10-30T09:00:00.000Z",
      })
    ).toBe("2026-10-30T09:00:00.000Z");
  });
});

describe("enrichCancellationSessionDates", () => {
  it("fills missing cancel session dates from matching booking deductions", () => {
    const records: AdjustmentRecord[] = [
      {
        date: "2026-10-24T12:00:00.000Z",
        attendanceDate: "2026-10-30T16:00:00.000Z",
        className: "Power Flow",
        amount: 1,
        type: "DEDUCT",
        source: "BOOKING",
        reason: "Power Flow",
      },
      {
        date: "2026-10-24T14:00:00.000Z",
        className: "Power Flow",
        amount: 1,
        type: "ADD",
        source: "MEMBER_CANCELLATION",
        reason: "Cancelled: Power Flow",
      },
    ];

    const enriched = enrichCancellationSessionDates(records);
    expect(enriched[1].attendanceDate).toBe("2026-10-30T16:00:00.000Z");

    const display = getAdjustmentDisplayDates(enriched[1]);
    expect(display.showSessionSubtext).toBe(true);
    expect(display.sessionDate).toBe("2026-10-30T16:00:00.000Z");
  });

  it("keeps an existing distinct session date on cancellations", () => {
    const records: AdjustmentRecord[] = [
      {
        date: "2026-10-25T12:00:00.000Z",
        attendanceDate: "2026-11-02T10:00:00.000Z",
        className: "Elevate",
        amount: 1,
        type: "ADD",
        source: "MEMBER_CANCELLATION",
        reason: "Cancelled: Elevate",
      },
      {
        date: "2026-10-20T12:00:00.000Z",
        attendanceDate: "2026-10-28T10:00:00.000Z",
        className: "Elevate",
        amount: 1,
        type: "DEDUCT",
        source: "BOOKING",
        reason: "Elevate",
      },
    ];

    const enriched = enrichCancellationSessionDates(records);
    expect(enriched[0].attendanceDate).toBe("2026-11-02T10:00:00.000Z");
  });

  it("maps sessionDate-only refunds into displayable session subtext", () => {
    const sessionDate = resolveAdjustmentSessionDate({
      sessionDate: "2026-11-04T10:00:00.000Z",
    });
    const display = getAdjustmentDisplayDates({
      date: "2026-10-31T09:00:00.000Z",
      attendanceDate: sessionDate,
    });
    expect(display.showSessionSubtext).toBe(true);
    expect(formatSession(display.sessionDate)).toBe("04 Nov 2026");
  });
});

function formatSession(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
