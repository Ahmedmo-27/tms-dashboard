/**
 * Member profile shows which sales rep the member is assigned to.
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Member } from "@/components/ui/members/columns";

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/ui/cards/packages", () => ({ default: () => null }));
vi.mock("@/components/ui/cards/bookings", () => ({ default: () => null }));
vi.mock("@/components/ui/cards/ptAttendance", () => ({ default: () => null }));
vi.mock("@/components/ui/cards/deductions", () => ({ default: () => null }));
vi.mock("@/components/ui/dialogs/member package/sub-package", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/dialogs/member package/add-classes", () => ({
  default: () => null,
}));
vi.mock(
  "@/components/ui/dialogs/member package/record-past-sessions-dialog",
  () => ({ default: () => null })
);
vi.mock("@/components/ui/dialogs/member-bookings/book-class", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/dialogs/open-gym/open-gym-drop-in-dialog", () => ({
  OpenGymDropInDialog: () => null,
}));
vi.mock("@/components/ui/dialogs/pt/pt-drop-in-dialog", () => ({
  PtDropInDialog: () => null,
}));
vi.mock("@/components/ui/dialogs/pt/pt-settle-dialog", () => ({
  PtSettleDialog: () => null,
}));
vi.mock("@/components/ui/dialogs/members/edit-member-dialog", () => ({
  EditMemberDialog: () => null,
}));

import { MemberWorkspace } from "@/components/ui/members/member-workspace";

const baseMember: Member = {
  id: "u-1",
  name: "Ahmed Hassan",
  phone: "01001234567",
  email: "ahmed@example.com",
  activePkgs: 1,
  packages: [],
  bookings: [],
  ptAttendance: [],
  nationalId: "29801011234567",
};

describe("MemberWorkspace sales rep label", () => {
  it("shows which sales rep the member is assigned to", () => {
    render(
      <MemberWorkspace
        member={{
          ...baseMember,
          soldBy: { _id: "sales-1", name: "Nour Saleh", role: "sales" },
        }}
        packages={[]}
        scheduledClasses={[]}
      />
    );

    expect(screen.getByText("Sold by Nour Saleh")).toBeInTheDocument();
  });

  it("shows when no sales rep is assigned", () => {
    render(
      <MemberWorkspace
        member={{ ...baseMember, soldBy: null }}
        packages={[]}
        scheduledClasses={[]}
      />
    );

    expect(screen.getByText("No sales rep")).toBeInTheDocument();
  });
});
