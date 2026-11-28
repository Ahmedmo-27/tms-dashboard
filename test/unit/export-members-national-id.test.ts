import { describe, expect, it } from "vitest";
import { hasNationalId } from "@/lib/data/member";
import {
  buildMembersExcelHtml,
  membersWithNationalId,
  type ExportableMember,
} from "@/lib/utils/export-members";

const sampleMembers: ExportableMember[] = [
  {
    id: "1",
    name: "With ID",
    phone: "01000000001",
    nationalId: "30106010107145",
    createdAt: "2026-11-01T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Missing ID",
    phone: "01000000002",
    nationalId: "",
    createdAt: "2026-11-02T10:00:00.000Z",
  },
  {
    id: "3",
    name: "Whitespace ID",
    phone: "01000000003",
    nationalId: "   ",
    createdAt: "2026-11-03T10:00:00.000Z",
  },
  {
    id: "4",
    name: "No ID field",
    phone: "01000000004",
    createdAt: "2026-11-04T10:00:00.000Z",
  },
];

describe("hasNationalId", () => {
  it("accepts non-empty national IDs", () => {
    expect(hasNationalId("30106010107145")).toBe(true);
    expect(hasNationalId(" ABC123 ")).toBe(true);
  });

  it("rejects missing or blank values", () => {
    expect(hasNationalId(undefined)).toBe(false);
    expect(hasNationalId(null)).toBe(false);
    expect(hasNationalId("")).toBe(false);
    expect(hasNationalId("   ")).toBe(false);
  });
});

describe("membersWithNationalId / Excel export", () => {
  it("keeps only members that have a national ID value", () => {
    const filtered = membersWithNationalId(sampleMembers);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("With ID");
    expect(filtered[0]?.nationalId).toBe("30106010107145");
  });

  it("omits blank national ID rows from the Excel HTML", () => {
    const html = buildMembersExcelHtml(sampleMembers);
    expect(html).toContain("With ID");
    expect(html).toContain("30106010107145");
    expect(html).not.toContain("Missing ID");
    expect(html).not.toContain("Whitespace ID");
    expect(html).not.toContain("No ID field");
  });
});
