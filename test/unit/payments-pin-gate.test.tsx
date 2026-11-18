import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const state = vi.hoisted(() => ({
  role: "branch_admin" as string,
}));

vi.mock("@/lib/hooks", () => ({
  useAppSelector: (selector: (s: unknown) => unknown) =>
    selector({ auth: { user: { role: state.role } } }),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/data/payments", () => ({
  verifyPaymentsPin: vi.fn(async (pin: string) => pin.trim() === "1967"),
}));

import { PaymentsPinGate } from "@/components/ui/payments/payments-pin-gate";

describe("PaymentsPinGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
    state.role = "branch_admin";
  });

  it("renders children directly for management role without requiring a PIN", () => {
    state.role = "management";
    render(
      <PaymentsPinGate>
        <div data-testid="payments-content">Secret Payments Data</div>
      </PaymentsPinGate>
    );

    expect(screen.getByTestId("payments-content")).toBeDefined();
    expect(screen.queryByText("Payments Protected")).toBeNull();
  });

  it("renders children directly for accountant role without requiring a PIN", () => {
    state.role = "accountant";
    render(
      <PaymentsPinGate>
        <div data-testid="payments-content">Secret Payments Data</div>
      </PaymentsPinGate>
    );

    expect(screen.getByTestId("payments-content")).toBeDefined();
    expect(screen.queryByText("Payments Protected")).toBeNull();
  });

  it("blocks branch_admin from viewing payments and shows the PIN lock card", () => {
    state.role = "branch_admin";
    render(
      <PaymentsPinGate>
        <div data-testid="payments-content">Secret Payments Data</div>
      </PaymentsPinGate>
    );

    expect(screen.queryByTestId("payments-content")).toBeNull();
    expect(screen.getByText("Payments Protected")).toBeDefined();
    expect(screen.getByPlaceholderText("Enter PIN")).toBeDefined();
  });

  it("shows an error when branch_admin enters an incorrect PIN", async () => {
    state.role = "branch_admin";
    render(
      <PaymentsPinGate>
        <div data-testid="payments-content">Secret Payments Data</div>
      </PaymentsPinGate>
    );

    const input = screen.getByPlaceholderText("Enter PIN");
    fireEvent.change(input, { target: { value: "0000" } });

    const unlockBtn = screen.getByText("Unlock Payments");
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(screen.getByText("Incorrect PIN. Please try again.")).toBeDefined();
    });

    expect(screen.queryByTestId("payments-content")).toBeNull();
    expect(sessionStorage.getItem("tms_payments_pin_unlocked")).toBeNull();
  });

  it("unlocks payments when branch_admin enters the correct PIN (1967)", async () => {
    state.role = "branch_admin";
    render(
      <PaymentsPinGate>
        <div data-testid="payments-content">Secret Payments Data</div>
      </PaymentsPinGate>
    );

    const input = screen.getByPlaceholderText("Enter PIN");
    fireEvent.change(input, { target: { value: "1967" } });

    const unlockBtn = screen.getByText("Unlock Payments");
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(screen.getByTestId("payments-content")).toBeDefined();
    });

    expect(sessionStorage.getItem("tms_payments_pin_unlocked")).toBe("true");
  });

  it("remembers unlocked state from sessionStorage", () => {
    sessionStorage.setItem("tms_payments_pin_unlocked", "true");
    state.role = "branch_admin";

    render(
      <PaymentsPinGate>
        <div data-testid="payments-content">Secret Payments Data</div>
      </PaymentsPinGate>
    );

    expect(screen.getByTestId("payments-content")).toBeDefined();
  });

  it("re-locks payments when onLock is called", () => {
    sessionStorage.setItem("tms_payments_pin_unlocked", "true");
    state.role = "branch_admin";

    function ChildComponent({ onLock }: { onLock?: () => void }) {
      return (
        <div>
          <div data-testid="payments-content">Secret Payments Data</div>
          <button data-testid="lock-btn" onClick={onLock}>
            Lock
          </button>
        </div>
      );
    }

    render(
      <PaymentsPinGate>
        <ChildComponent />
      </PaymentsPinGate>
    );

    expect(screen.getByTestId("payments-content")).toBeDefined();

    const lockBtn = screen.getByTestId("lock-btn");
    fireEvent.click(lockBtn);

    expect(screen.queryByTestId("payments-content")).toBeNull();
    expect(screen.getByText("Payments Protected")).toBeDefined();
    expect(sessionStorage.getItem("tms_payments_pin_unlocked")).toBeNull();
  });
});
