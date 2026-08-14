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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/core/api-error";
import { addWalkIn } from "@/lib/actions/booking-actions";
import { ManagementBranchField } from "@/components/ui/management-branch-field";
import { useManagementBranchSelection } from "@/lib/hooks/use-management-branch-selection";
import { Plus, ArrowBigRight } from "lucide-react";
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";

interface ActionState {
  success: boolean;
  errors: Record<string, string | boolean> | null | ApiError;
  data: unknown | null;
  usrId?: string;
  defaultValues?: {
    name: string;
    phoneNumber: string;
    scid: string;
  };
}

const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

export function AddWalkIn({
  scid,
  compact = false,
}: {
  scid: string;
  compact?: boolean;
}) {
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
    defaultValues: {
      name: "",
      phoneNumber: "",
      scid: "",
    },
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  const handleDateChange = (date: string) => {
    setPaymentDate(date);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsLoading(false);
    }
  };

  const [state, formAction, pending] = useActionState(
    async (currentState: ActionState, formData: FormData) => {
      setIsLoading(true);

      const defaultValues = {
        name: formData.get("name") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        scid: formData.get("scid") as string,
      };

      try {
        const result = await addWalkIn(currentState, formData);

        if (result.success) {
          setIsOpen(false);
          return initialState;
        }

        const errMsg =
          result?.errors &&
          typeof result.errors === "object" &&
          "message" in result.errors
            ? String((result.errors as { message?: string }).message ?? "")
            : "";

        // Prefer structured userId when API provides it; fall back to 24-char ObjectId in message.
        const existingUserId =
          (result as { usrId?: string; userId?: string }).usrId ||
          (result as { userId?: string }).userId ||
          (OBJECT_ID_RE.test(errMsg) ? errMsg : null);

        if (existingUserId) {
          return {
            ...currentState,
            errors: { userExists: true },
            usrId: existingUserId,
            defaultValues,
          };
        }

        return { ...result, defaultValues } as ActionState;
      } finally {
        setIsLoading(false);
      }
    },
    initialState
  );

  const fieldErrors =
    state.errors &&
    typeof state.errors === "object" &&
    !(state.errors instanceof ApiError)
      ? (state.errors as Record<string, string | boolean>)
      : null;

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <Button
          variant={compact ? "outline" : "ghost"}
          size={compact ? "sm" : "default"}
          onSelect={(e) => e.preventDefault()}
          onClick={() => {
            resetModalBranch();
            setIsOpen(true);
          }}
          className={compact ? "cursor-pointer" : "cursor-pointer border-2 w-full"}
        >
          <Plus />
          {compact ? "Walk-in" : "Add Walk In"}
        </Button>

        <DialogContent className="z-50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Add a walk-in for a Guest User
            </DialogTitle>
            <DialogDescription>
              Enter guest details to reserve a spot in this class.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="mt-4 space-y-6">
            <input type="hidden" name="scid" value={scid} />
            <ManagementBranchField
              locationId={locationId}
              onLocationChange={setModalLocationId}
              needsBranchSelection={needsBranchSelection}
              disabled={pending || isLoading}
            />

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label htmlFor="walk-in-name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="walk-in-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Abdelrahman Tolan"
                />
                {fieldErrors && typeof fieldErrors.name === "string" && (
                  <p className="text-destructive text-xs">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="walk-in-phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="walk-in-phone"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+20 123 456 7890"
                />
                {fieldErrors && typeof fieldErrors.phoneNumber === "string" && (
                  <p className="text-destructive text-xs">
                    {fieldErrors.phoneNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="walk-in-amount" className="text-sm font-medium">
                  Amount
                </Label>
                <Input
                  id="walk-in-amount"
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

            {fieldErrors?.userExists && (
              <div className="flex items-center justify-between rounded-md border border-destructive p-3">
                <p className="text-destructive text-sm font-medium">
                  User Already Exists - Navigate to user profile
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Open existing member profile"
                  onClick={() =>
                    window.open(
                      `/dashboard/our-members/${state.usrId}`,
                      "_blank"
                    )
                  }
                >
                  <ArrowBigRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {fieldErrors &&
              typeof fieldErrors.message === "string" &&
              !fieldErrors.userExists && (
                <p className="text-destructive text-sm">{fieldErrors.message}</p>
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
