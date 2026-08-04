"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useMemo, useState } from "react";
import { useActionState } from "react";
import { isSameDay } from "date-fns";
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { bookClassAction } from "@/lib/actions/member-actions";
import { ScheduledClass } from "../../schedule/columns";
import { Member } from "../../members/columns";
import { Package } from "../../packages/columns";
import { ApiError } from "@/core/api-error";
import {
  getBookingEligibility,
  isBookingTimeRestriction,
} from "@/lib/utils/booking-eligibility";
import { useAppSelector } from "@/lib/hooks";
import { canOverrideBookingTimeRestrictions } from "@/lib/config/roles";

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
  member,
  catalogPackages,
}: {
  scheduledClasses: ScheduledClass[];
  uid: string;
  member: Member;
  catalogPackages: Package[];
}) {
  const user = useAppSelector((state) => state.auth.user);
  const canOverrideTime = canOverrideBookingTimeRestrictions(
    user?.role as string | undefined
  );
  const [open, setOpen] = useState(false);
  const [cls, setCls] = useState<ScheduledClass | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [overrideTimeRestrictions, setOverrideTimeRestrictions] =
    useState(false);

  const classesForDate = useMemo(() => {
    if (!selectedDate) return [];
    const pickedDate = new Date(selectedDate);
    return scheduledClasses.filter((scheduledClass) =>
      isSameDay(new Date(scheduledClass.startTime), pickedDate)
    );
  }, [scheduledClasses, selectedDate]);

  const eligibility = useMemo(() => {
    if (!cls) return null;
    return getBookingEligibility(
      member,
      cls,
      catalogPackages,
      scheduledClasses,
      {
        overrideTimeRestrictions:
          canOverrideTime && overrideTimeRestrictions,
      }
    );
  }, [
    cls,
    member,
    catalogPackages,
    scheduledClasses,
    canOverrideTime,
    overrideTimeRestrictions,
  ]);

  const requiresTimeOverride = useMemo(() => {
    if (!cls) return false;
    return isBookingTimeRestriction(
      getBookingEligibility(member, cls, catalogPackages, scheduledClasses)
    );
  }, [cls, member, catalogPackages, scheduledClasses]);

  const pickerSelectedDate = useMemo(
    () => (selectedDate ? new Date(selectedDate) : undefined),
    [selectedDate]
  );

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setCls(null);
    setOverrideTimeRestrictions(false);
  }, []);

  const handleClassChange = useCallback(
    (value: string) => {
      setCls(
        classesForDate.find(
          (scheduledClass) => scheduledClass._id === value
        ) ?? null
      );
      setOverrideTimeRestrictions(false);
    },
    [classesForDate]
  );

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

  const canSubmit = !!cls && eligibility?.eligible === true && !pending;

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Book a class
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setCls(null);
            setSelectedDate("");
            setOverrideTimeRestrictions(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a class</DialogTitle>
            <DialogDescription>Select the class.</DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <input type="hidden" name="uid" value={uid} />
            <input type="hidden" name="clsId" value={cls ? cls._id : ""} />
            <input
              type="hidden"
              name="overrideTimeRestrictions"
              value={overrideTimeRestrictions ? "true" : "false"}
            />
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
                    selectedDate={pickerSelectedDate}
                    handleDateChange={handleDateChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Class</Label>
                <Select
                  value={cls?._id}
                  onValueChange={handleClassChange}
                  disabled={
                    selectedDate === "" || pending || classesForDate.length === 0
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {classesForDate.map((scheduledClass) => (
                      <SelectItem
                        key={scheduledClass._id}
                        value={scheduledClass._id!}
                        className="hover:bg-accent"
                      >
                        <span className="flex w-full items-center justify-between gap-3">
                          <span>{scheduledClass.className}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              scheduledClass.startTime
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDate && classesForDate.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No classes scheduled for this date.
                  </p>
                )}
              </div>

              {cls && eligibility && (
                <div
                  className={
                    eligibility.eligible
                      ? "rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                      : "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  }
                >
                  {eligibility.eligible ? (
                    <>
                      Member can book this class using package{" "}
                      <span className="font-medium">
                        {eligibility.coveringPackageName}
                      </span>
                      .
                      {overrideTimeRestrictions && requiresTimeOverride && (
                        <span className="block mt-1 text-xs">
                          Booking with time restriction override.
                        </span>
                      )}
                    </>
                  ) : (
                    eligibility.reason
                  )}
                </div>
              )}

              {canOverrideTime && requiresTimeOverride && (
                <div className="flex gap-2 items-start">
                  <Checkbox
                    id="member-override-time-restrictions"
                    checked={overrideTimeRestrictions}
                    onCheckedChange={(checked) =>
                      setOverrideTimeRestrictions(checked === true)
                    }
                    disabled={pending}
                  />
                  <label
                    htmlFor="member-override-time-restrictions"
                    className="cursor-pointer text-sm leading-snug"
                  >
                    Override time restriction — allow booking even though this
                    class has already started
                  </label>
                </div>
              )}
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
                disabled={!canSubmit}
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
