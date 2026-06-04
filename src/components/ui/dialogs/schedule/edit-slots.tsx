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
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function EditSlotsDialog({
  scheduledClass,
}: {
  scheduledClass: ScheduledClass;
}) {
  const [currentSlots, setCurrentSlots] = useState(
    scheduledClass.availableSlots
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCurrentSlots(scheduledClass.availableSlots);
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
        setOpen(false);
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
          Change remaining slots
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add slots to {scheduledClass.className}</DialogTitle>
          <DialogDescription>
            Change open slots to selected class
          </DialogDescription>
          <form action={formAction}>
            <input type="hidden" name="scid" value={scheduledClass._id} />
            <input type="hidden" name="availableSlots" value={currentSlots} />
            <div className="flex items-center w-full gap-2 justify-center">
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
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
