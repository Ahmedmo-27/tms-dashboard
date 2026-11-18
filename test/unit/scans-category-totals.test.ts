import { describe, it, expect } from "vitest";
import { formatCategory } from "@/lib/utils/catalog";

interface MockClassScan {
  status: "SUCCESS" | "FAILED" | "WILL_PAY" | "FOC";
}

interface MockClassContainer {
  classData: {
    category?: string;
  };
  classScans: MockClassScan[];
}

function computeCategorySuccessfulScans(scans: MockClassContainer[]) {
  const isSuccessScan = (scan: MockClassScan) =>
    scan.status === "SUCCESS" || scan.status === "WILL_PAY" || scan.status === "FOC";

  const counts: Record<string, number> = {};
  for (const item of scans) {
    const rawCategory = item.classData?.category || "OTHER";
    const successful =
      item.classScans?.filter(isSuccessScan).length || 0;
    counts[rawCategory] = (counts[rawCategory] || 0) + successful;
  }
  return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
}

describe("Scans Monitor Category Totals", () => {
  it("aggregates successful scans for matching categories", () => {
    const scans: MockClassContainer[] = [
      {
        classData: { category: "STUDIO" },
        classScans: [
          { status: "SUCCESS" },
          { status: "WILL_PAY" },
          { status: "FAILED" },
        ],
      },
      {
        classData: { category: "STUDIO" },
        classScans: [{ status: "FOC" }],
      },
      {
        classData: { category: "FUNCTIONAL_TRAINING" },
        classScans: [
          { status: "SUCCESS" },
          { status: "FAILED" },
        ],
      },
    ];

    const result = computeCategorySuccessfulScans(scans);

    expect(result).toEqual([
      ["FUNCTIONAL_TRAINING", 1],
      ["STUDIO", 3],
    ]);
  });

  it("formats category names properly", () => {
    expect(formatCategory("STUDIO")).toBe("Studio");
    expect(formatCategory("FUNCTIONAL_TRAINING")).toBe("Functional Training");
    expect(formatCategory("PRE_POST_NATAL")).toBe("Pre Post Natal");
    expect(formatCategory("WORKSHOPS")).toBe("Workshops");
  });

  it("handles classes with no scans or zero successful scans", () => {
    const scans: MockClassContainer[] = [
      {
        classData: { category: "STUDIO" },
        classScans: [{ status: "FAILED" }],
      },
    ];

    const result = computeCategorySuccessfulScans(scans);
    expect(result).toEqual([["STUDIO", 0]]);
  });

  it("handles empty scans list", () => {
    const result = computeCategorySuccessfulScans([]);
    expect(result).toEqual([]);
  });
});
