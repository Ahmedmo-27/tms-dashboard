/**
 * The server action behind the front-desk "Add Package" dialog.
 *
 * The dialog posts the salesperson as a hidden form field, so this pins the
 * wiring between that field and the API call: picked → sent, "no salesperson"
 * → omitted, so a sale is never credited to an empty string.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/data/member", () => ({
  editMemberPackage: vi.fn(),
  adjustMemberPackage: vi.fn(),
  subscribeGuestToPackage: vi.fn(),
  subscribeMemberToPackage: vi.fn(),
  unsubscribeMemberFromPackage: vi.fn(),
}));

vi.mock("@/lib/data/users", () => ({ addMember: vi.fn() }));
vi.mock("@/lib/data/bookings", () => ({
  bookClass: vi.fn(),
  bookDropIn: vi.fn(),
  cancelBooking: vi.fn(),
}));
vi.mock("@/lib/data/auth", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ role: "branch_admin" }),
}));

import { subscribePackageAction } from "@/lib/actions/member-actions";
import { subscribeMemberToPackage } from "@/lib/data/member";

const subscribe = subscribeMemberToPackage as unknown as ReturnType<
  typeof vi.fn
>;

/** The form the subscribe dialog submits, with overridable fields. */
function formData(fields: Record<string, string> = {}): FormData {
  const data = new FormData();
  const base: Record<string, string> = {
    uid: "u-1",
    pkgId: "pkg-1",
    startDate: "2026-10-26T00:00:00.000Z",
    endDate: "2026-11-25T00:00:00.000Z",
    paymentDate: "",
    amount: "1600",
    paymentMethod: "CASH",
    priceChanged: "false",
    pendingDeduction: "false",
    locationId: "loc-1",
    soldBy: "",
    ...fields,
  };
  for (const [key, value] of Object.entries(base)) data.append(key, value);
  return data;
}

/** Positional args of subscribeMemberToPackage, by name. */
function callArgs() {
  const [
    uid,
    pkgId,
    startDate,
    paymentMethod,
    paymentDate,
    amount,
    locationId,
    pendingDeduction,
    previousSessionDates,
    soldBy,
  ] = subscribe.mock.calls[0];
  return {
    uid,
    pkgId,
    startDate,
    paymentMethod,
    paymentDate,
    amount,
    locationId,
    pendingDeduction,
    previousSessionDates,
    soldBy,
  };
}

beforeEach(() => {
  subscribe.mockReset();
  subscribe.mockResolvedValue({ message: "Package Added!" });
});

describe("subscribePackageAction — sales attribution", () => {
  it("sends the salesperson the front desk picked", async () => {
    const result = await subscribePackageAction(null, formData({ soldBy: "sales-1" }));

    expect(result.success).toBe(true);
    expect(callArgs().soldBy).toBe("sales-1");
  });

  it("omits the salesperson when none was picked", async () => {
    await subscribePackageAction(null, formData({ soldBy: "" }));

    // undefined, never "" — the API reads a present soldBy as an account id.
    expect(callArgs().soldBy).toBeUndefined();
  });

  it("omits the salesperson when the dialog never sent the field", async () => {
    const data = formData();
    data.delete("soldBy");

    await subscribePackageAction(null, data);

    expect(callArgs().soldBy).toBeUndefined();
  });

  it("keeps the rest of the sale intact alongside the salesperson", async () => {
    await subscribePackageAction(
      null,
      formData({ soldBy: "sales-1", priceChanged: "true", pendingDeduction: "true" })
    );

    expect(callArgs()).toMatchObject({
      uid: "u-1",
      pkgId: "pkg-1",
      startDate: "2026-10-26T00:00:00.000Z",
      paymentMethod: "CASH",
      paymentDate: undefined,
      amount: "1600",
      locationId: "loc-1",
      pendingDeduction: true,
      soldBy: "sales-1",
    });
  });

  it("reports a rejected salesperson instead of claiming the sale went through", async () => {
    subscribe.mockRejectedValue(
      new Error("A package can only be credited to a sales account")
    );

    const result = await subscribePackageAction(null, formData({ soldBy: "sales-1" }));

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.errors)).toContain("sales account");
  });
});
