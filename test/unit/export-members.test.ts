import { describe, expect, it } from "vitest";
import { buildMembersExcelHtml } from "@/lib/utils/export-members";

describe("buildMembersExcelHtml", () => {
  it("includes national ID and member identity columns", () => {
    const html = buildMembersExcelHtml([
      {
        id: "1",
        name: "Habiba Nabil Elsayed",
        phone: "01117008301",
        email: "habiba@example.com",
        nationalId: "30106010107145",
        createdAt: "2026-03-15T10:00:00.000Z",
      },
    ]);

    expect(html).toContain("National ID");
    expect(html).toContain("30106010107145");
    expect(html).toContain("Habiba Nabil Elsayed");
    expect(html).toContain("01117008301");
    expect(html).toContain("Members");
    // Phone / national ID must stay text so Excel keeps leading zeros.
    expect(html).toMatch(
      /mso-number-format:'\\@'[^>]*>01117008301</
    );
    expect(html).toMatch(
      /mso-number-format:'\\@'[^>]*>30106010107145</
    );
  });

  it("escapes HTML in member fields", () => {
    const html = buildMembersExcelHtml([
      {
        id: "2",
        name: `A & B <script>alert("x")</script>`,
        phone: "01000000000",
        nationalId: "ABC&123",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(html).toContain("A &amp; B &lt;script&gt;");
    expect(html).toContain("ABC&amp;123");
    expect(html).not.toContain("<script>alert");
  });
});
