import { describe, expect, it } from "vitest";
import { parseMembers } from "@/lib/utils/parsers/members-parser";

describe("parseMembers soldBy", () => {
  it("maps the populated member-level sales rep onto the member", () => {
    const [member] = parseMembers([
      {
        uid: { _id: "u1", name: "Ahmed Hassan", phoneNumber: "0100" },
        soldBy: { _id: "sales-1", name: "Nour Saleh", role: "sales" },
        packages: [],
      },
    ]);

    expect(member.soldBy).toEqual({
      _id: "sales-1",
      name: "Nour Saleh",
      role: "sales",
    });
  });

  it("leaves soldBy null when the member has no sales rep", () => {
    const [member] = parseMembers([
      {
        uid: { _id: "u1", name: "Ahmed Hassan", phoneNumber: "0100" },
        soldBy: null,
        packages: [],
      },
    ]);

    expect(member.soldBy).toBeNull();
  });
});
