/**
 * The Sales Attribution page body.
 *
 * Covers what the page is responsible for: the query it sends for the filters
 * in the URL, how a sold package is presented (including legacy mixed-case
 * statuses), and the role gate on the assign action — the API enforces that
 * gate, this keeps the UI from offering a button that would 403.
 */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";

const state = vi.hoisted(() => ({
  role: "sales_manager" as string,
  search: "" as string,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/dashboard/sales",
  useSearchParams: () => new URLSearchParams(state.search),
}));

vi.mock("@/lib/hooks", () => ({
  useAppSelector: (selector: (s: unknown) => unknown) =>
    selector({ auth: { user: { role: state.role } } }),
}));

vi.mock("@/lib/hooks/use-locations", () => ({
  useLocations: () => ({
    locations: [
      { _id: "loc-1", branchName: "Cairo", location: "Cairo" },
      { _id: "loc-2", branchName: "NorthCoast", location: "NC" },
    ],
    isLoading: false,
    error: false,
  }),
}));

vi.mock("@/lib/hooks/use-sales-accounts", () => ({
  useSalesAccounts: () => ({
    accounts: [
      {
        _id: "sales-1",
        name: "Nour Saleh",
        email: "n@e.com",
        phoneNumber: "01000000001",
        role: "sales",
        branchName: null,
      },
    ],
    isLoading: false,
    error: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/data/sales", () => ({
  getSoldPackages: vi.fn(),
  assignSoldPackageSeller: vi.fn(),
}));

import { SalesAttributionContainer } from "@/components/ui/sales/sales-attribution-container";
import { getSoldPackages } from "@/lib/data/sales";

const fetchRows = getSoldPackages as unknown as ReturnType<typeof vi.fn>;

const ROWS = [
  {
    memberPackageId: "mp-1",
    uid: "u-1",
    memberName: "Ahmed Hassan",
    memberPhone: "01001234567",
    pkgId: "pkg-1",
    packageName: "Studio 10",
    category: "PERSONAL_TRAINING",
    pkgStartDate: "2026-10-01T12:00:00.000Z",
    pkgEndDate: "2026-11-15T12:00:00.000Z",
    // Legacy casing, exactly as the older rows are stored.
    status: "Active",
    locationId: "loc-1",
    branchName: "Cairo",
    soldBy: null,
    soldByAssignedAt: null,
    soldByAssignedBy: null,
  },
  {
    memberPackageId: "mp-2",
    uid: "u-2",
    memberName: "Salma Sameh",
    memberPhone: "01900123456",
    pkgId: "pkg-2",
    packageName: "Yoga Flow - 16 Classes",
    category: "STUDIO",
    pkgStartDate: "2026-09-01T12:00:00.000Z",
    pkgEndDate: "2026-10-15T12:00:00.000Z",
    status: "COMPLETED",
    locationId: null,
    branchName: "",
    soldBy: { _id: "sales-1", name: "Nour Saleh", role: "sales" },
    soldByAssignedAt: "2026-10-20T10:00:00.000Z",
    soldByAssignedBy: { _id: "mgmt-1", name: "Omar Tolan" },
  },
];

const PAYLOAD = {
  rows: ROWS,
  total: 2,
  page: 1,
  limit: 25,
  totalPages: 1,
  summary: {
    total: 2,
    assigned: 1,
    unassigned: 1,
    bySeller: [{ salesAccountId: "sales-1", name: "Nour Saleh", count: 1 }],
  },
};

const rowOf = (memberName: string) =>
  screen.getByText(memberName).closest("tr") as HTMLElement;

beforeEach(() => {
  state.role = "sales_manager";
  state.search = "";
  fetchRows.mockReset();
  fetchRows.mockResolvedValue(PAYLOAD);
});

describe("SalesAttributionContainer", () => {
  it("asks for the first page of sold packages on open", async () => {
    render(<SalesAttributionContainer />);

    await waitFor(() => expect(fetchRows).toHaveBeenCalled());
    expect(fetchRows).toHaveBeenCalledWith({
      page: 1,
      limit: 25,
      search: undefined,
      seller: undefined,
      locationId: undefined,
    });
  });

  it("carries the filters from the URL into the query", async () => {
    state.search = "seller=unassigned&locationId=loc-2&search=Nour&page=2";

    render(<SalesAttributionContainer />);

    await waitFor(() =>
      expect(fetchRows).toHaveBeenCalledWith({
        page: 2,
        limit: 25,
        search: "Nour",
        seller: "unassigned",
        locationId: "loc-2",
      })
    );
  });

  it("shows each sale with its member, package and branch", async () => {
    render(<SalesAttributionContainer />);

    const row = await waitFor(() => rowOf("Ahmed Hassan"));
    expect(within(row).getByText("01001234567")).toBeInTheDocument();
    expect(within(row).getByText("Studio 10")).toBeInTheDocument();
    // Category underscores are spelled out for reading.
    expect(within(row).getByText("PERSONAL TRAINING")).toBeInTheDocument();
    expect(within(row).getByText("01 Oct 2026")).toBeInTheDocument();
    expect(within(row).getByText("Cairo")).toBeInTheDocument();
  });

  it("normalises a legacy mixed-case status", async () => {
    render(<SalesAttributionContainer />);

    const row = await waitFor(() => rowOf("Ahmed Hassan"));
    expect(within(row).getByText("ACTIVE")).toBeInTheDocument();
  });

  it("falls back to a dash where no branch was recorded", async () => {
    render(<SalesAttributionContainer />);

    const row = await waitFor(() => rowOf("Salma Sameh"));
    expect(within(row).getByText("—")).toBeInTheDocument();
  });

  it("separates credited sales from uncredited ones", async () => {
    render(<SalesAttributionContainer />);

    const uncredited = await waitFor(() => rowOf("Ahmed Hassan"));
    expect(within(uncredited).getByText("Not credited")).toBeInTheDocument();
    expect(
      within(uncredited).getByRole("button", { name: /Assign/ })
    ).toBeInTheDocument();

    const credited = rowOf("Salma Sameh");
    expect(within(credited).getByText("Nour Saleh")).toBeInTheDocument();
    expect(
      within(credited).getByRole("button", { name: /Change/ })
    ).toBeInTheDocument();
  });

  it("summarises how many sales are credited", async () => {
    render(<SalesAttributionContainer />);

    await waitFor(() => expect(fetchRows).toHaveBeenCalled());
    expect(screen.getByText("Credited to a salesperson")).toBeInTheDocument();
    expect(screen.getByText("Not credited yet")).toBeInTheDocument();
    // One chip per salesperson with a sale in this selection.
    expect(
      screen.getByRole("button", { name: "Nour Saleh · 1" })
    ).toBeInTheDocument();
  });

  it.each(["management", "admin", "branch_admin", "sales_manager", "accountant"])(
    "offers the assign action to %s",
    async (role) => {
      state.role = role;
      render(<SalesAttributionContainer />);

      const row = await waitFor(() => rowOf("Ahmed Hassan"));
      expect(
        within(row).getByRole("button", { name: /Assign/ })
      ).toBeInTheDocument();
    }
  );

  it.each(["mailer", "coach", "member"])(
    "hides the assign action from %s, which the API would refuse",
    async (role) => {
      state.role = role;
      render(<SalesAttributionContainer />);

      const row = await waitFor(() => rowOf("Ahmed Hassan"));
      expect(
        within(row).queryByRole("button", { name: /Assign|Change/ })
      ).toBeNull();
    }
  );

  it("offers the branch filter to a cross-branch role", async () => {
    render(<SalesAttributionContainer />);

    await waitFor(() => expect(fetchRows).toHaveBeenCalled());
    expect(screen.getByText("All Branches")).toBeInTheDocument();
  });

  it("hides the branch filter from branch_admin, which is pinned to its own", async () => {
    state.role = "branch_admin";
    render(<SalesAttributionContainer />);

    await waitFor(() => expect(fetchRows).toHaveBeenCalled());
    expect(screen.queryByText("All Branches")).toBeNull();
  });

  it("says so plainly when nothing matches the filters", async () => {
    fetchRows.mockResolvedValue({
      ...PAYLOAD,
      rows: [],
      total: 0,
      summary: { total: 0, assigned: 0, unassigned: 0, bySeller: [] },
    });

    render(<SalesAttributionContainer />);

    expect(
      await screen.findByText("No sold packages match these filters.")
    ).toBeInTheDocument();
  });

  it("survives a failed load without blanking the page", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    fetchRows.mockRejectedValue(new Error("Access denied"));

    render(<SalesAttributionContainer />);

    expect(
      await screen.findByText("No sold packages match these filters.")
    ).toBeInTheDocument();
    expect(screen.getByText("Sales Attribution")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
