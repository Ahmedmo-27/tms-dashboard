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
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useActionState } from "react";
import { adjustClassesAction } from "@/lib/actions/member-actions";

export default function AddClasses({
  pkg,
  uid,
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
}) {
  const [amount, setAmount] = useState(1);
  const [type, setType] = useState<"ADD" | "DEDUCT">("ADD");
  const [open, setOpen] = useState(false);
  const [reasonError, setReasonError] = useState("");

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
        setOpen(false);
        setAmount(1);
        setType("ADD");
        return initialState;
      }
      return result;
    },
    initialState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="cursor-pointer"
        >
          Adjust classes
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
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
              disabled={pkg.status === "POSTPONED"}
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

          {/* Reason */}
          <div className="space-y-1">
            <Textarea
              name="reason"
              placeholder="Reason for adjustment (required)"
              rows={3}
              onChange={() => setReasonError("")}
            />
            {reasonError && (
              <p className="text-sm text-destructive">{reasonError}</p>
            )}
            {state.errors && (
              <p className="text-sm text-destructive">
                {(state.errors as any)?.message ?? "Something went wrong"}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
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
  );
}
