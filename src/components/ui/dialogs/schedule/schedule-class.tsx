"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TimePicker from "../../timepicker";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { scheduleClassAction } from "@/lib/actions/schedule-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ApiError } from "@/core/api-error";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: any | null;
  defaultValues?: {
    clsId: string;
    coachId: string;
    startTime: string;
    endTime: string;
    availableSlots: string;
  };
}

export function ScheduleClass({
  classIdsMap,
  date,
  coaches,
}: {
  classIdsMap: Map<string, string>;
  date?: Date;
  coaches: any[];
}) {
  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      clsId: "",
      coachId: "",
      startTime: "",
      endTime: "",
      availableSlots: "",
    },
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCoach, setSelectedCoach] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState<
    string | undefined
  >(date?.toString());
  const [selectedEndDate, setSelectedEndDate] = useState<string | undefined>(
    date?.toString()
  );

  useEffect(() => {
    setSelectedStartDate(date?.toString());
    setSelectedEndDate(date?.toString());
  }, [date]);

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        className: formData.get("className") as string,
        clsId: formData.get("clsId") as string,
        coachId: formData.get("coachId") as string,
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
        availableSlots: Number(formData.get("availableSlots") as string),
        location: formData.get("location") as string,
      };
      const result = await scheduleClassAction(currentState, formData);
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
    
    <div>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={
          !date || date.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
        }
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Schedule Class</span>
        <span className="sm:hidden">Schedule</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="z-50 max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Scheduling a class
            </DialogTitle>
            <DialogDescription>Add class data</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="mt-4">
            <input type="hidden" name="clsId" defaultValue={selectedClass} />
            <input
              type="hidden"
              name="startTime"
              defaultValue={selectedStartDate?.toString()}
            />
            <input
              type="hidden"
              name="endTime"
              defaultValue={selectedEndDate?.toString()}
            />
            <input type="hidden" name="className" defaultValue={"Test Name"} />
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Class</Label>
                <Select
                  name="clsId"
                  defaultValue={state?.defaultValues?.clsId || selectedClass}
                  disabled={pending}
                  onValueChange={setSelectedClass}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(classIdsMap.entries()).map(([title, id]) => (
                      <SelectItem
                        key={id}
                        value={id}
                        className="hover:bg-accent"
                        onChange={() => setSelectedClass(id)}
                      >
                        {title}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Slots</Label>
                <Input
                  name="availableSlots"
                  type="number"
                  min={1}
                  max={100}
                  className="w-full"
                  defaultValue={state?.defaultValues?.availableSlots}
                />
                {state?.errors &&
                typeof state.errors == "object" &&
                "availableSlots" in state.errors ? (
                  <p className="text-destructive text-sm">
                    {(state.errors as any).availableSlots}
                  </p>
                ) : null}
              </div>

              <input type="hidden" name="coachId" defaultValue={selectedCoach} />
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Coach</Label>
                  <Select
                    name="coachId"
                    defaultValue={
                      state?.defaultValues?.coachId || selectedCoach
                    }
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
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Time</Label>
                <TimePicker
                  date={new Date(selectedStartDate || new Date())}
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
                  date={new Date(selectedEndDate || new Date())}
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

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <Button
                type="button"
                className="px-4 w-full sm:w-auto"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 w-full sm:w-auto"
                disabled={pending}
                variant="default"
              >
                {pending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
