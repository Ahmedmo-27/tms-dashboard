"use client";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useActionState } from "react";
import { changePkgEndDate } from "@/lib/actions/member-actions";
import toast from "react-hot-toast";

export default function ExtendPackage({
  pkg,
  uid,
  variant = "none",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  pkg: { name: string; pkgEndDate: string; pkgStartDate?: string; _id: string };
  uid: string;
  variant?: "menu" | "button" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [date, setDate] = useState(pkg.pkgEndDate);

  const initialState = {
    success: false,
    errors: null,
    data: null,
  };

  const [state, formAction] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await changePkgEndDate(currentState, formData);
      if (result.success) {
        toast.success("Package expiry date updated successfully");
        setOpen(false);
        return initialState;
      }
      const message =
        (result.errors as any)?.message ?? "Failed to extend package";
      toast.error(message);
      return result;
    },
    initialState
  );

  return (
    <>
      {variant === "button" && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setOpen(true)}
        >
          Extend
        </Button>
      )}
      {variant === "menu" && (
        <DropdownMenuItem
          onSelect={() => setOpen(true)}
          className="cursor-pointer"
        >
          Change package end date
        </DropdownMenuItem>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Extend Package</DialogTitle>
            <DialogDescription>Select the new expiry date.</DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <input type="hidden" name="uid" value={uid} />
            <input type="hidden" name="pkgId" value={pkg._id} />
            <input type="hidden" name="pkgStartDate" value={pkg.pkgStartDate} />
            <input type="hidden" name="date" value={date} />
            <div
              className="relative cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <DatePicker
                date={new Date(date)}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate.toISOString());
                  }
                }}
              />
            </div>
            {state?.errors &&
              typeof state.errors === "object" &&
              "message" in state.errors &&
              (state.errors as { message?: string }).message && (
                <p className="text-destructive text-sm mt-3">
                  {(state.errors as { message?: string }).message}
                </p>
              )}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={state.success}
              >
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
