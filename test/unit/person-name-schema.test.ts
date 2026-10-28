/**
 * The member name rule: two or three names, each capitalized.
 *
 * Three parts are accepted because accounts created before the rule existed
 * carry a middle name, and the edit dialog has to be able to save them again.
 */
import { describe, expect, it } from "vitest";
import {
  editMemberSchema,
  newUserSchema,
  nonUserBookingSchema,
  personNameSchema,
  walkInSchema,
} from "@/lib/schemas/newUserSchema";

const accepted = [
  "Abdelrahman Tolan",
  "Habiba Nabil Elsayed",
  "Mona Ali",
  "Ahmed Mohamed Hassan",
  "  Habiba Nabil Elsayed  ", // surrounding whitespace is trimmed first
];

const rejected = [
  "Habiba", // one name only
  "Habiba Nabil Elsayed Ahmed", // four names
  "habiba nabil elsayed", // no capitals
  "Habiba nabil Elsayed", // middle name not capitalized
  "HABIBA NABIL", // all caps
  "Habiba  Nabil", // double space
  "Habiba Nabil-Elsayed", // hyphen is not a separator
  "Habiba Nabil 3lsayed", // digits
  "",
];

describe("personNameSchema", () => {
  it.each(accepted)("accepts %j", (name) => {
    expect(personNameSchema.safeParse(name).success).toBe(true);
  });

  it.each(rejected)("rejects %j", (name) => {
    expect(personNameSchema.safeParse(name).success).toBe(false);
  });

  it("trims the value it returns", () => {
    expect(personNameSchema.parse("  Mona Ali  ")).toBe("Mona Ali");
  });

  it("explains the rule when it fails", () => {
    const result = personNameSchema.safeParse("habiba");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message).join(" ")).toContain(
        "2 or 3 names",
      );
    }
  });
});

describe("the schemas that validate a person's name", () => {
  it("lets the edit-member dialog save a three-part name", () => {
    const result = editMemberSchema.safeParse({
      name: "Habiba Nabil Elsayed",
      phoneNumber: "01117008301",
      email: "habibanabil_el@yahoo.com",
      nationalId: "30106010107145",
    });
    expect(result.success).toBe(true);
  });

  it("still rejects a one-part name in the edit-member dialog", () => {
    const result = editMemberSchema.safeParse({
      name: "Habiba",
      phoneNumber: "01117008301",
      nationalId: "30106010107145",
    });
    expect(result.success).toBe(false);
  });

  it("accepts three-part names on sign-up, bookings and walk-ins", () => {
    expect(
      newUserSchema.safeParse({
        name: "Habiba Nabil Elsayed",
        phoneNumber: "01117008301",
        password: "Str0ng!passw0rd",
      }).success,
    ).toBe(true);

    expect(
      nonUserBookingSchema.safeParse({
        name: "Habiba Nabil Elsayed",
        phoneNumber: "01117008301",
        scid: "sc-1",
      }).success,
    ).toBe(true);

    expect(
      walkInSchema.safeParse({
        name: "Habiba Nabil Elsayed",
        phoneNumber: "01117008301",
        scid: "sc-1",
      }).success,
    ).toBe(true);
  });
});
