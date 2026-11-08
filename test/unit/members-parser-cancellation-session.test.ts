import { describe, expect, it } from "vitest";
import { parseMembers } from "@/lib/utils/parsers/members-parser";
import { getAdjustmentDisplayDates } from "@/lib/utils/adjustment-session-date";

describe("parseMembers cancellation session dates", () => {
  it("maps sessionDate onto attendanceDate for refunds", () => {
    const [member] = parseMembers([
      {
        uid: { _id: "u1", name: "Mirna Saafan", phoneNumber: "0100" },
        packages: [
          {
            pkgId: { _id: "p1", name: "10 Studio" },
            pkgStartDate: "2026-09-15",
            pkgEndDate: "2026-11-14",
            remainingClasses: 5,
            status: "ACTIVE",
            adjustmentHistory: [
              {
                date: "2026-10-25T12:00:00.000Z",
                sessionDate: "2026-11-02T10:00:00.000Z",
                type: "ADD",
                source: "MEMBER_CANCELLATION",
                amount: 1,
                reason: "Cancelled: Elevate",
                className: "Elevate",
              },
            ],
          },
        ],
      },
    ]);

    const cancel = member.packages[0].adjustmentHistory[0];
    expect(cancel.attendanceDate).toBe("2026-11-02T10:00:00.000Z");
    expect(getAdjustmentDisplayDates(cancel).showSessionSubtext).toBe(true);
  });

  it("enriches member cancellations missing session dates from booking rows", () => {
    const [member] = parseMembers([
      {
        uid: { _id: "u1", name: "Mirna Saafan", phoneNumber: "0100" },
        packages: [
          {
            pkgId: { _id: "p1", name: "10 Studio" },
            pkgStartDate: "2026-09-15",
            pkgEndDate: "2026-11-14",
            remainingClasses: 5,
            status: "ACTIVE",
            adjustmentHistory: [
              {
                date: "2026-10-24T10:00:00.000Z",
                attendanceDate: "2026-10-30T16:00:00.000Z",
                type: "DEDUCT",
                source: "BOOKING",
                amount: 1,
                reason: "Power Flow",
                className: "Power Flow",
              },
              {
                date: "2026-10-24T14:00:00.000Z",
                type: "ADD",
                source: "MEMBER_CANCELLATION",
                amount: 1,
                reason: "Cancelled: Power Flow",
                className: "Power Flow",
              },
            ],
          },
        ],
      },
    ]);

    const cancel = member.packages[0].adjustmentHistory.find(
      (r) => r.source === "MEMBER_CANCELLATION"
    );
    expect(cancel?.attendanceDate).toBe("2026-10-30T16:00:00.000Z");
    expect(getAdjustmentDisplayDates(cancel!).showSessionSubtext).toBe(true);
  });
});
