/**
 * The dialog that credits a sold package to a sales account.
 *
 * Radix's Select is replaced with a native <select> so these cases exercise the
 * dialog's own behaviour — what it submits, when Save is live, what happens on
 * failure — rather than Radix's pointer handling in jsdom.
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <select
      aria-label="Sales account"
      value={value}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock("@/lib/data/sales", () => ({
  assignSoldPackageSeller: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { AssignSellerDialog } from "@/components/ui/sales/assign-seller-dialog";
import { assignSoldPackageSeller } from "@/lib/data/sales";
import { toast } from "react-hot-toast";
import type { SalesAccount, SoldPackage } from "@/types/sales";

const assign = assignSoldPackageSeller as unknown as ReturnType<typeof vi.fn>;

const ACCOUNTS: SalesAccount[] = [
  {
    _id: "sales-1",
    name: "Nour Saleh",
    email: "nour@example.com",
    phoneNumber: "01000000001",
    role: "sales",
    branchName: null,
  },
  {
    _id: "sales-2",
    name: "Sales Lead",
    email: "lead@example.com",
    phoneNumber: "01000000002",
    role: "sales_manager",
    branchName: null,
  },
];

const SOLD: SoldPackage = {
  memberPackageId: "mp-1",
  uid: "u-1",
  memberName: "Ahmed Hassan",
  memberPhone: "01001234567",
  pkgId: "pkg-1",
  packageName: "Studio 10",
  category: "STUDIO",
  pkgStartDate: "2026-10-01T12:00:00.000Z",
  pkgEndDate: "2026-11-15T12:00:00.000Z",
  status: "ACTIVE",
  locationId: "loc-1",
  branchName: "Cairo",
  soldBy: null,
  soldByAssignedAt: null,
  soldByAssignedBy: null,
};

function setup(soldPackage: SoldPackage | null = SOLD, accounts = ACCOUNTS) {
  const onAssigned = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <AssignSellerDialog
      soldPackage={soldPackage}
      accounts={accounts}
      accountsLoading={false}
      open
      onOpenChange={onOpenChange}
      onAssigned={onAssigned}
    />
  );
  return { onAssigned, onOpenChange, user: userEvent.setup() };
}

describe("AssignSellerDialog", () => {
  it("renders nothing without a sold package", () => {
    const { container } = render(
      <AssignSellerDialog
        soldPackage={null}
        accounts={ACCOUNTS}
        accountsLoading={false}
        open
        onOpenChange={vi.fn()}
        onAssigned={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("names the sale it is about to credit", () => {
    setup();

    expect(screen.getByText("Studio 10")).toBeInTheDocument();
    expect(
      screen.getByText("Ahmed Hassan · 01001234567")
    ).toBeInTheDocument();
    expect(screen.getByText(/Started 01 Oct 2026 · Cairo/)).toBeInTheDocument();
  });

  it("offers every sales account, with the manager marked", () => {
    setup();

    expect(screen.getByRole("option", { name: "Nour Saleh" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Sales Lead (Sales Manager)" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "No salesperson" })
    ).toBeInTheDocument();
  });

  it("keeps Save inert until the attribution actually changes", async () => {
    const { user } = setup();

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await user.selectOptions(
      screen.getByLabelText("Sales account"),
      "sales-1"
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("credits the sale to the chosen account and closes", async () => {
    assign.mockResolvedValue({ memberPackageId: "mp-1" });
    const { user, onAssigned, onOpenChange } = setup();

    await user.selectOptions(screen.getByLabelText("Sales account"), "sales-1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("mp-1", "sales-1"));
    expect(toast.success).toHaveBeenCalledWith("Credited to Nour Saleh");
    expect(onAssigned).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("starts from the current salesperson and can clear it", async () => {
    assign.mockResolvedValue({ memberPackageId: "mp-1", soldBy: null });
    const credited: SoldPackage = {
      ...SOLD,
      soldBy: { _id: "sales-1", name: "Nour Saleh", role: "sales" },
      soldByAssignedAt: "2026-10-20T10:00:00.000Z",
      soldByAssignedBy: { _id: "mgmt-1", name: "Omar Tolan" },
    };
    const { user, onAssigned } = setup(credited);

    const select = screen.getByLabelText("Sales account") as HTMLSelectElement;
    expect(select.value).toBe("sales-1");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await user.selectOptions(select, "__unassigned__");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("mp-1", null));
    expect(toast.success).toHaveBeenCalledWith("Sales attribution cleared");
    expect(onAssigned).toHaveBeenCalledTimes(1);
  });

  it("shows who last set the attribution", () => {
    setup({
      ...SOLD,
      soldBy: { _id: "sales-1", name: "Nour Saleh", role: "sales" },
      soldByAssignedAt: "2026-10-20T10:00:00.000Z",
      soldByAssignedBy: { _id: "mgmt-1", name: "Omar Tolan" },
    });

    expect(
      screen.getByText(/Last set by Omar Tolan on 20 Oct 2026/)
    ).toBeInTheDocument();
  });

  it("reports a failed save and stays open", async () => {
    assign.mockRejectedValue(new Error("This package was not sold at your branch"));
    const { user, onAssigned, onOpenChange } = setup();

    await user.selectOptions(screen.getByLabelText("Sales account"), "sales-1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "This package was not sold at your branch"
      )
    );
    expect(onAssigned).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("points at the Accounts page when no sales account exists yet", () => {
    setup(SOLD, []);

    expect(
      screen.getByText(/No sales accounts exist yet/)
    ).toBeInTheDocument();
  });
});
