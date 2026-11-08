/**
 * Sales attribution data layer.
 *
 * The dashboard talks to three endpoints; what matters here is the query it
 * builds (an empty filter must not become `?seller=all`, which the API would
 * reject as an account id) and that it unwraps the API envelope.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted, so the spies live inside the factory and are read back
// from the mocked module rather than captured in top-level variables.
vi.mock("@/lib/tms-api", () => ({
  tms: { get: vi.fn(), patch: vi.fn() },
}));

import {
  assignSoldPackageSeller,
  getSalesAccounts,
  getSoldPackages,
} from "@/lib/data/sales";
import { tms } from "@/lib/tms-api";

const get = tms.get as unknown as ReturnType<typeof vi.fn>;
const patch = tms.patch as unknown as ReturnType<typeof vi.fn>;

const envelope = (data: unknown) => ({ data: { data } });

beforeEach(() => {
  get.mockReset();
  patch.mockReset();
});

describe("getSalesAccounts", () => {
  it("returns the accounts out of the response envelope", async () => {
    get.mockResolvedValue(
      envelope({ accounts: [{ _id: "a1", name: "Nour", role: "sales" }] })
    );

    await expect(getSalesAccounts()).resolves.toEqual([
      { _id: "a1", name: "Nour", role: "sales" },
    ]);
    expect(get).toHaveBeenCalledWith("/sales/accounts");
  });

  it("returns an empty list when the payload carries none", async () => {
    get.mockResolvedValue(envelope({}));
    await expect(getSalesAccounts()).resolves.toEqual([]);
  });
});

describe("getSoldPackages", () => {
  const params = async (args?: Parameters<typeof getSoldPackages>[0]) => {
    get.mockResolvedValue(envelope({ rows: [], total: 0 }));
    await getSoldPackages(args);
    return get.mock.calls[0][1].params;
  };

  it("defaults to the first page", async () => {
    expect(await params()).toEqual({ page: 1, limit: 25 });
  });

  it("passes page, limit, search, seller, branch and dates through", async () => {
    expect(
      await params({
        page: 3,
        limit: 50,
        search: "  Nour  ",
        seller: "a1",
        locationId: "loc1",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      })
    ).toEqual({
      page: 3,
      limit: 50,
      search: "Nour",
      seller: "a1",
      locationId: "loc1",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
  });

  it("drops the 'all' sentinels instead of sending them to the API", async () => {
    // The API reads `seller` as an account id, so "all" must never be sent.
    expect(await params({ seller: "all", locationId: "all" })).toEqual({
      page: 1,
      limit: 25,
    });
  });

  it("keeps the unassigned and assigned filters, which the API understands", async () => {
    expect(await params({ seller: "unassigned" })).toMatchObject({
      seller: "unassigned",
    });
    get.mockReset();
    expect(await params({ seller: "assigned" })).toMatchObject({
      seller: "assigned",
    });
  });

  it("drops a blank search rather than sending an empty match", async () => {
    expect(await params({ search: "   " })).toEqual({ page: 1, limit: 25 });
  });

  it("returns the page payload as the API sent it", async () => {
    const payload = {
      rows: [{ memberPackageId: "p1" }],
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
      summary: { total: 1, assigned: 0, unassigned: 1, bySeller: [] },
    };
    get.mockResolvedValue(envelope(payload));

    await expect(getSoldPackages()).resolves.toEqual(payload);
  });
});

describe("assignSoldPackageSeller", () => {
  it("patches the sold package with the chosen account", async () => {
    patch.mockResolvedValue(envelope({ memberPackageId: "p1" }));

    await assignSoldPackageSeller("p1", "a1");

    expect(patch).toHaveBeenCalledWith("/sales/packages/p1/seller", {
      soldBy: "a1",
    });
  });

  it("sends null to clear the attribution", async () => {
    patch.mockResolvedValue(envelope({ memberPackageId: "p1", soldBy: null }));

    await assignSoldPackageSeller("p1", null);

    expect(patch).toHaveBeenCalledWith("/sales/packages/p1/seller", {
      soldBy: null,
    });
  });

  it("propagates an API error instead of reporting success", async () => {
    patch.mockRejectedValue(new Error("Access denied"));

    await expect(assignSoldPackageSeller("p1", "a1")).rejects.toThrow(
      "Access denied"
    );
  });
});
