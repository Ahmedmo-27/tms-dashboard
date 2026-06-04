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
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { bookClassAction } from "@/lib/actions/member-actions";
import { ScheduledClass } from "../../schedule/columns";
import { ApiError } from "@/core/api-error";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | ApiError | null;
  data: any | null;
  defaultValues?: {
    uid: string;
    clsId: string;
  };
}

export default function BookClass({
  scheduledClasses,
  uid,
}: {
  scheduledClasses: ScheduledClass[];
  uid: string;
}) {
  const [open, setOpen] = useState(false);
  const [cls, setCls] = useState<ScheduledClass | null>();
  const [selectedDate, setSelectedDate] = useState("");

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const initialState = {
    success: false,
    errors: null,
    data: null,
  };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        uid: formData.get("uid") as string,
        clsId: formData.get("clsId") as string,
      };

      const result = await bookClassAction(currentState, formData);

      if (result.success) {
        setOpen(false);
        return initialState;
      }
      return {
        ...result,
        defaultValues,
      };
    },
    initialState
  );

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Book a class
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a class</DialogTitle>
            <DialogDescription>Select the class.</DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <input type="hidden" name="uid" value={uid} />
            <input type="hidden" name="clsId" value={cls ? cls._id : ""} />
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <PopoverDatePicker
                    className="w-full"
                    selectedDate={
                      selectedDate === "" ? undefined : new Date(selectedDate)
                    }
                    handleDateChange={handleDateChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Class</Label>
                <Select
                  name="clsId"
                  defaultValue={cls?._id}
                  onValueChange={(value) =>
                    setCls(scheduledClasses.find((cls) => cls._id === value))
                  }
                  disabled={selectedDate === "" || pending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduledClasses
                      .filter((cls) => {
                        const clsDate = new Date(cls.startTime);
                        return (
                          clsDate.toDateString() ===
                          new Date(selectedDate).toDateString()
                        );
                      })
                      .map((cls) => (
                        <SelectItem
                          key={cls._id}
                          value={cls._id || ""}
                          className="hover:bg-accent flex flex-row justify-between"
                        >
                          <div>{cls.className}</div>
                          <div>
                            {new Date(cls.startTime).toLocaleTimeString()}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {state?.errors && typeof state.errors == "object" && (
              <div className="text-destructive text-sm  ">
                {state.errors.message && state.errors.message}
              </div>
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
    </div>
  );
}
