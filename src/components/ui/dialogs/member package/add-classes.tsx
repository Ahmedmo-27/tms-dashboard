"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { adjustClassesAction } from "@/lib/actions/member-actions";
import toast from "react-hot-toast";

const DEDUCT_REASON_CHIPS = [
  "Completed session",
  "No-show",
  "Makeup",
  "Administrative",
] as const;

function toLocalInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AddClasses({
  pkg,
  uid,
  variant = "none",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  pkg: {
    [x: string]: any;
    name: string;
    remainingClasses: number;
    _id: string;
    pkgStartDate: string;
    status: string;
  };
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

  const [amount, setAmount] = useState(1);
  const [type, setType] = useState<"ADD" | "DEDUCT">("ADD");
  const [reasonError, setReasonError] = useState("");

  // Deduct reason chips & session date (matching coach dashboard deduction modal)
  const [deductChip, setDeductChip] = useState<string>(DEDUCT_REASON_CHIPS[0]);
  const [deductNotes, setDeductNotes] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(toLocalInputValue(new Date()));

  const composedDeductReason = deductNotes.trim()
    ? `${deductChip}. ${deductNotes.trim()}`
    : deductChip;

  const initialState = { success: false, errors: null, data: null };

  const [state, formAction] = useActionState(
    async (currentState: any, formData: FormData) => {
      const reason = (formData.get("reason") as string)?.trim();
      if (!reason) {
        setReasonError("A reason is required");
        return currentState;
      }
      setReasonError("");
      const result = await adjustClassesAction(currentState, formData);
      if (result.success) {
        toast.success(
          `Successfully ${type === "ADD" ? "added" : "deducted"} ${amount} class${amount > 1 ? "es" : ""}`
        );
        setOpen(false);
        setAmount(1);
        setType("ADD");
        setDeductChip(DEDUCT_REASON_CHIPS[0]);
        setDeductNotes("");
        setSessionDate(toLocalInputValue(new Date()));
        return initialState;
      }
      const message =
        (result.errors as any)?.message ?? "Failed to adjust classes";
      toast.error(message);
      return result;
    },
    initialState
  );

  return (
    <>
      {variant === "button" && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Add classes
        </Button>
      )}
      {variant === "menu" && (
        <DropdownMenuItem
          onSelect={() => setOpen(true)}
          className="cursor-pointer"
        >
          Adjust classes
        </DropdownMenuItem>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust classes for {pkg.name}</DialogTitle>
            <DialogDescription>
              Current remaining:{" "}
              <span className="font-semibold">{pkg.remainingClasses}</span>
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4 mt-2">
            <input type="hidden" name="pkgId" value={pkg._id} />
            <input type="hidden" name="pkgStartDate" value={pkg.pkgStartDate} />
            <input type="hidden" name="uid" value={uid} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="amount" value={amount} />

            {/* ADD / DEDUCT toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "ADD" ? "default" : "outline"}
                className="flex-1 cursor-pointer"
                onClick={() => setType("ADD")}
              >
                Add
              </Button>
              <Button
                type="button"
                variant={type === "DEDUCT" ? "destructive" : "outline"}
                className="flex-1 cursor-pointer"
                onClick={() => setType("DEDUCT")}
              >
                Deduct
              </Button>
            </div>

            {/* Amount stepper */}
            <div className="flex items-center gap-2 justify-center">
              <Button
                variant="outline"
                size="icon"
                type="button"
                className="cursor-pointer"
                disabled={amount <= 1}
                onClick={() => setAmount(amount - 1)}
              >
                -
              </Button>
              <Input
                type="number"
                className="text-center w-20"
                value={amount}
                readOnly
              />
              <Button
                variant="outline"
                size="icon"
                type="button"
                className="cursor-pointer"
                onClick={() => setAmount(amount + 1)}
              >
                +
              </Button>
            </div>

            {/* Reason & Date Controls */}
            {type === "DEDUCT" ? (
              <div className="space-y-4">
                <input type="hidden" name="reason" value={composedDeductReason} />
                <input type="hidden" name="sessionDate" value={sessionDate} />

                {/* Reason Chips */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <div className="flex flex-wrap gap-2">
                    {DEDUCT_REASON_CHIPS.map((chip) => (
                      <Button
                        key={chip}
                        type="button"
                        size="sm"
                        variant={deductChip === chip ? "default" : "outline"}
                        className="h-8 text-xs cursor-pointer"
                        onClick={() => setDeductChip(chip)}
                      >
                        {chip}
                      </Button>
                    ))}
                  </div>
                  <Input
                    placeholder="Optional notes"
                    value={deductNotes}
                    onChange={(e) => setDeductNotes(e.target.value)}
                  />
                </div>

                {/* Session Date */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Session Date</label>
                  <Input
                    type="date"
                    value={sessionDate}
                    max={toLocalInputValue(new Date())}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              /* ADD Reason textarea */
              <div className="space-y-1">
                <label className="text-sm font-medium">Reason for addition</label>
                <Textarea
                  name="reason"
                  placeholder="Reason for adjustment (required)"
                  rows={3}
                  onChange={() => setReasonError("")}
                  required
                />
              </div>
            )}

            {reasonError && (
              <p className="text-sm text-destructive">{reasonError}</p>
            )}
            {state.errors && (
              <p className="text-sm text-destructive">
                {(state.errors as any)?.message ?? "Something went wrong"}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
