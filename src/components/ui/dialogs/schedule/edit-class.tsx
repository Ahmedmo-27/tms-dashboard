"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TimePicker from "../../timepicker";
import { useState } from "react";
import { useActionState } from "react";
import { editClassAction } from "@/lib/actions/schedule-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/core/api-error";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { format } from "date-fns";
import { DatePicker } from "../../date-picker";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: any | null;
  defaultValues?: {
    scid: string;
    coachId: string;
    startTime: string;
    endTime: string;
  };
}

export function EditClassComponent({
  coaches,
  scheduledClass,
}: {
  coaches: any[];
  scheduledClass: ScheduledClass;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(scheduledClass.coachId);
  const [selectedStartDate, setSelectedStartDate] = useState<string>(
    scheduledClass?.startTime?.toString() || new Date().toString()
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string>(
    scheduledClass?.endTime?.toString() || new Date().toString()
  );

  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      scid: scheduledClass?._id || "",
      coachId: scheduledClass?.coachName || "",
      startTime: scheduledClass?.startTime || "",
      endTime: scheduledClass?.endTime || "",
    },
  };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        scid: formData.get("scid") as string,
        coachId: formData.get("coachId") as string,
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
      };
      const result = await editClassAction(currentState, formData);
      if (result.success) {
        setIsOpen(false);
        return initialState;
      }

      return {
        ...result,
        defaultValues,
      };
    },
    initialState
  );

  const handleStartDateChange = (date: string) => {
    setSelectedStartDate(date);
  };

  const handleEndDateChange = (date: string) => {
    setSelectedEndDate(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="cursor-pointer"
        >
          Edit Class
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {scheduledClass.className}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="mt-4">
          <input
            type="hidden"
            name="scid"
            defaultValue={scheduledClass?._id || ""}
          />
          <input
            type="hidden"
            name="startTime"
            defaultValue={selectedStartDate || scheduledClass?.startTime}
          />
          <input
            type="hidden"
            name="endTime"
            defaultValue={selectedEndDate || scheduledClass?.endTime}
          />
          <div className="grid grid-cols-2 gap-6">
            <input type="hidden" name="coachId" defaultValue={selectedCoach} />
            <div className="space-y-6 col-span-2">
              <Label className="text-sm font-medium">Coach</Label>
              <Select
                name="coachId"
                defaultValue={state?.defaultValues?.coachId || selectedCoach}
                disabled={pending}
                onValueChange={setSelectedCoach}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((coach) => (
                    <SelectItem
                      key={coach._id}
                      value={coach._id}
                      className="hover:bg-accent"
                      onChange={() => setSelectedCoach(coach._id)}
                    >
                      {coach.coachName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.errors &&
              typeof state.errors == "object" &&
              "clsId" in state.errors ? (
                <p className="text-destructive text-sm">
                  {(state.errors as any).clsId}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 ">
              <Label className="text-sm font-medium">Start Date</Label>
              <DatePicker
                date={new Date(selectedStartDate)}
                onSelect={(newDate) => {
                  if (newDate) {
                    handleStartDateChange(newDate.toISOString());
                    handleEndDateChange(newDate.toISOString());
                  }
                }}
              />
            </div>

            <div className="flex flex-col">
              <div className="space-y-2 ">
                <Label className="text-sm font-medium">Start Time</Label>
                <TimePicker
                  date={new Date(selectedStartDate)}
                  onChange={handleStartDateChange}
                />
                {state?.errors &&
                typeof state.errors == "object" &&
                "startTime" in state.errors ? (
                  <p className="text-destructive text-sm">
                    {(state.errors as any).startTime}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">End Time</Label>
                <TimePicker
                  date={new Date(selectedEndDate)}
                  onChange={handleEndDateChange}
                />
                {state?.errors &&
                typeof state.errors == "object" &&
                "endTime" in state.errors ? (
                  <p className="text-destructive text-sm">
                    {(state.errors as any).endTime}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              className="px-4"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4"
              disabled={pending}
              variant="default"
            >
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
