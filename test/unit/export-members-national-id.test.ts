import { describe, expect, it } from "vitest";
import { hasNationalId } from "@/lib/data/member";

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
