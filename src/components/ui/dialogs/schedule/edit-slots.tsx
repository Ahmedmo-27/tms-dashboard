"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { editSlotsAction } from "@/lib/actions/schedule-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

export default function EditSlotsDialog({
  scheduledClass,
  variant = "none",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  scheduledClass: ScheduledClass;
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

  const [currentSlots, setCurrentSlots] = useState(
    Math.max(0, scheduledClass.availableSlots ?? 0)
  );

  useEffect(() => {
    setCurrentSlots(Math.max(0, scheduledClass.availableSlots ?? 0));
  }, [scheduledClass]);

  const initialState = {
    success: false,
    errors: null,
    data: null,
  };

  const [state, formAction] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await editSlotsAction(currentState, formData);
      if (result.success) {
        toast.success("Slots updated successfully");
        setOpen(false);
        return initialState;
      }
      const message =
        (result.errors as any)?.message ?? "Failed to update slots";
      toast.error(message);
      return result;
    },
    initialState
  );

  return (
    <>
      {variant === "button" && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Change remaining slots
        </Button>
      )}
      {variant === "menu" && (
        <DropdownMenuItem
          onSelect={() => setOpen(true)}
          className="cursor-pointer"
        >
          Change remaining slots
        </DropdownMenuItem>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Add slots to {scheduledClass.className}</DialogTitle>
            <DialogDescription>
              Change open slots for selected class
            </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <input type="hidden" name="scid" value={scheduledClass._id} />
            <input type="hidden" name="availableSlots" value={currentSlots} />
            <div className="flex items-center w-full gap-2 justify-center my-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  disabled={currentSlots < 1}
                  onClick={() => setCurrentSlots(currentSlots - 1)}
                  type="button"
                >
                  -
                </Button>
                <Input
                  type="number"
                  name="availableSlots"
                  className="text-center w-full"
                  value={currentSlots}
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setCurrentSlots(currentSlots + 1)}
                  type="button"
                >
                  +
                </Button>
              </div>
            </div>
            {state?.errors &&
              typeof state.errors === "object" &&
              "message" in state.errors &&
              (state.errors as { message?: string }).message && (
                <p className="text-destructive text-sm my-3">
                  {(state.errors as { message?: string }).message}
                </p>
              )}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={state.success}>
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
