"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/core/api-error";
import { recordNonUserBookingPaymentAction } from "@/lib/actions/booking-actions";
import { ManagementBranchField } from "@/components/ui/management-branch-field";
import { useManagementBranchSelection } from "@/lib/hooks/use-management-branch-selection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import { Input } from "@/components/ui/input";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: unknown | null;
  defaultValues?: {
    bookingId: string;
    paymentMethod: "CASH" | "VISA" | "VALUE" | "INSTAPAY" | "";
  };
}

const paymentMethods = [
  { value: "VISA", header: "Visa" },
  { value: "VALU", header: "Valu" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "CASH", header: "Cash" },
  { value: "DEDUCTED", header: "Deducted from a new package" },
];

export function PaymentSelectorDialog({ bookingId }: { bookingId: string }) {
  const {
    locationId,
    setModalLocationId,
    needsBranchSelection,
    hasLocationId,
    resetModalBranch,
  } = useManagementBranchSelection();

  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: { bookingId: "", paymentMethod: "CASH" },
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");

  const handleDateChange = (date: string) => {
    setPaymentDate(date);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsLoading(false);
      setError(null);
    }
  };

  const [state, formAction, pending] = useActionState(
    async (currentState: ActionState, formData: FormData) => {
      setIsLoading(true);
      setError(null);

      const defaultValues = {
        bookingId: formData.get("bookingId") as string,
        paymentMethod: formData.get("paymentMethod") as ActionState["defaultValues"] extends infer D
          ? D extends { paymentMethod: infer P }
            ? P
            : ""
          : "",
      };

      try {
        const result = await recordNonUserBookingPaymentAction(
          currentState,
          formData
        );

        if (result.success) {
          setIsOpen(false);
          return initialState;
        }
        setError(result.errors as Error);
        return { ...result, defaultValues } as ActionState;
      } finally {
        setIsLoading(false);
      }
    },
    initialState
  );

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="font-normal h-auto py-0.5 px-2 border-yellow-500 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
          onClick={() => {
            resetModalBranch();
            setIsOpen(true);
          }}
        >
          Will Pay
        </Button>

        <DialogContent className="z-50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Confirm Guest Attendance
            </DialogTitle>
            <DialogDescription>
              Choose payment method to confirm attendance
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="mt-4 space-y-6">
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="paymentMethod" value={selectedPaymentMethod} />
            <ManagementBranchField
              locationId={locationId}
              onLocationChange={setModalLocationId}
              needsBranchSelection={needsBranchSelection}
              disabled={pending || isLoading}
            />

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Method</Label>
                <Select
                  value={selectedPaymentMethod}
                  onValueChange={(value) => setSelectedPaymentMethod(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem
                        key={method.value}
                        value={method.value || ""}
                        className="hover:bg-accent flex flex-row justify-between"
                      >
                        <div>{method.header}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error &&
                typeof error === "object" &&
                !(error instanceof ApiError) &&
                "paymentMethod" in error && (
                  <p className="text-destructive text-xs">
                    {String((error as Record<string, unknown>).paymentMethod)}
                  </p>
                )}

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Date</Label>
                <div onClick={(e) => e.stopPropagation()}>
                  <PopoverDatePicker
                    className="w-full"
                    selectedDate={
                      paymentDate === "" ? undefined : new Date(paymentDate)
                    }
                    handleDateChange={handleDateChange}
                  />
                </div>
                <input type="hidden" name="paymentDate" value={paymentDate} />
              </div>
            </div>

            {error && error.message && (
              <div className="flex items-center justify-between rounded-md border border-destructive p-3">
                <p className="text-destructive text-sm font-medium">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                className="px-4"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4"
                disabled={pending || isLoading || !hasLocationId}
              >
                {pending || isLoading ? "Saving..." : "Save Booking"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
