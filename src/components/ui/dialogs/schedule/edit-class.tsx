"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { editClassAction } from "@/lib/actions/schedule-actions";
import { MultiSelect } from "../../multiselect";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/core/api-error";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { format } from "date-fns";
import { DatePicker } from "../../date-picker";
import { Clock } from "lucide-react";
import {
  getDefaultClassDurationMinutes,
  formatDurationLabel,
  formatDurationBadge,
} from "@/lib/utils/class-duration";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: any | null;
  defaultValues?: {
    scid: string;
    coachId: string | string[];
    startTime: string;
    endTime: string;
  };
}

const DURATION_PRESETS = [30, 45, 50, 60, 75, 90];

export function EditClassComponent({
  coaches,
  scheduledClass,
  variant = "none",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  coaches: any[];
  scheduledClass: ScheduledClass;
  variant?: "menu" | "button" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>(
    Array.isArray(scheduledClass.coachId)
      ? scheduledClass.coachId
      : scheduledClass.coachId
      ? [scheduledClass.coachId]
      : []
  );
  const coachNameArray = scheduledClass.coachName ? scheduledClass.coachName.split(", ") : [];
  const [selectedCoachNames, setSelectedCoachNames] = useState<string[]>(
    coachNameArray
  );
  const [selectedStartDate, setSelectedStartDate] = useState<string>(
    scheduledClass?.startTime?.toString() || new Date().toString()
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string>(
    scheduledClass?.endTime?.toString() || new Date().toString()
  );

  useEffect(() => {
    if (!isOpen) return;
    const coachIds = Array.isArray(scheduledClass.coachId)
      ? scheduledClass.coachId
      : scheduledClass.coachId
      ? [scheduledClass.coachId]
      : [];
    const names = scheduledClass.coachName ? scheduledClass.coachName.split(", ") : [];
    setSelectedCoachIds(coachIds);
    setSelectedCoachNames(names);

    const startStr = scheduledClass?.startTime?.toString() || new Date().toString();
    let endStr = scheduledClass?.endTime?.toString();

    // If scheduledClass does not have a valid endTime, calculate fallback from default duration
    if (!endStr || isNaN(new Date(endStr).getTime())) {
      const defaultDurationMinutes = getDefaultClassDurationMinutes(scheduledClass?.className);
      const s = new Date(startStr).getTime();
      endStr = new Date(s + defaultDurationMinutes * 60 * 1000).toString();
    }

    setSelectedStartDate(startStr);
    setSelectedEndDate(endStr);
  }, [isOpen, scheduledClass]);

  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      scid: scheduledClass?._id || "",
      coachId: scheduledClass?.coachId || "",
      startTime: scheduledClass?.startTime || "",
      endTime: scheduledClass?.endTime || "",
    },
  };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        scid: formData.get("scid") as string,
        coachId: formData.getAll("coachId") as string[],
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
      };

      const startMs = new Date(defaultValues.startTime).getTime();
      const endMs = new Date(defaultValues.endTime).getTime();
      if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
        toast.error("End time must be after start time");
        return {
          success: false,
          errors: { endTime: "End time must be after start time" },
          data: null,
          defaultValues,
        };
      }

      const result = await editClassAction(currentState, formData);
      if (result.success) {
        toast.success("Class updated successfully");
        setIsOpen(false);
        return initialState;
      }

      const message =
        typeof result.errors === "object" && result.errors && "message" in result.errors
          ? String((result.errors as any).message)
          : "Failed to update class";
      toast.error(message);

      return {
        ...result,
        defaultValues,
      };
    },
    initialState
  );

  const startTimeValue = useMemo(() => {
    try {
      const d = new Date(selectedStartDate);
      return isNaN(d.getTime()) ? "10:00" : format(d, "HH:mm");
    } catch {
      return "10:00";
    }
  }, [selectedStartDate]);

  const endTimeValue = useMemo(() => {
    try {
      const d = new Date(selectedEndDate);
      return isNaN(d.getTime()) ? "11:00" : format(d, "HH:mm");
    } catch {
      return "11:00";
    }
  }, [selectedEndDate]);

  const currentDurationMinutes = useMemo(() => {
    const s = new Date(selectedStartDate).getTime();
    const e = new Date(selectedEndDate).getTime();
    const diff = e - s;
    if (!isNaN(diff) && diff > 0) {
      return Math.round(diff / (60 * 1000));
    }
    return 0;
  }, [selectedStartDate, selectedEndDate]);

  const isInvalidTimeRange = useMemo(() => {
    const s = new Date(selectedStartDate).getTime();
    const e = new Date(selectedEndDate).getTime();
    return isNaN(s) || isNaN(e) || e <= s;
  }, [selectedStartDate, selectedEndDate]);

  const handleStartTimeChange = (timeStr: string) => {
    if (!timeStr) return;
    const [h, m] = timeStr.split(":").map(Number);
    const start = new Date(selectedStartDate);
    start.setHours(isNaN(h) ? 10 : h, isNaN(m) ? 0 : m, 0, 0);

    const prevS = new Date(selectedStartDate).getTime();
    const prevE = new Date(selectedEndDate).getTime();
    const durationMs = !isNaN(prevS) && !isNaN(prevE) && prevE > prevS
      ? prevE - prevS
      : 60 * 60 * 1000;

    const end = new Date(start.getTime() + durationMs);
    setSelectedStartDate(start.toString());
    setSelectedEndDate(end.toString());
  };

  const handleEndTimeChange = (timeStr: string) => {
    if (!timeStr) return;
    const [h, m] = timeStr.split(":").map(Number);
    const end = new Date(selectedStartDate);
    end.setHours(isNaN(h) ? 11 : h, isNaN(m) ? 0 : m, 0, 0);
    setSelectedEndDate(end.toString());
  };

  const handleDurationChange = (minutes: number) => {
    if (isNaN(minutes) || minutes <= 0) return;
    const start = new Date(selectedStartDate);
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    setSelectedEndDate(end.toString());
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    const prevStart = new Date(selectedStartDate);
    const prevEnd = new Date(selectedEndDate);
    const durationMs = !isNaN(prevStart.getTime()) && !isNaN(prevEnd.getTime()) && prevEnd > prevStart
      ? prevEnd.getTime() - prevStart.getTime()
      : 60 * 60 * 1000;

    const updatedStart = new Date(newDate);
    updatedStart.setHours(prevStart.getHours(), prevStart.getMinutes(), 0, 0);

    const updatedEnd = new Date(updatedStart.getTime() + durationMs);
    setSelectedStartDate(updatedStart.toString());
    setSelectedEndDate(updatedEnd.toString());
  };

  const coachOptions = useMemo(() => {
    return Array.from(new Set(coaches.map((c) => c.coachName?.trim()).filter(Boolean)));
  }, [coaches]);

  const coachMap = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = [...coaches].sort((a, b) => (b.userId ? 1 : 0) - (a.userId ? 1 : 0));
    for (const c of sorted) {
      const name = c.coachName?.trim();
      if (name && !map.has(name)) {
        map.set(name, c._id);
      }
    }
    return map;
  }, [coaches]);

  return (
    <>
      {variant === "button" && (
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          Edit Class
        </Button>
      )}
      {variant === "menu" && (
        <DropdownMenuItem
          onSelect={() => setIsOpen(true)}
          className="cursor-pointer"
        >
          Edit Class
        </DropdownMenuItem>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto z-50"
        >
          <DialogHeader>
            <DialogTitle>Edit {scheduledClass.className}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="mt-4 space-y-5">
            <input
              type="hidden"
              name="scid"
              defaultValue={scheduledClass?._id || ""}
            />
            <input
              type="hidden"
              name="startTime"
              value={new Date(selectedStartDate).toISOString()}
            />
            <input
              type="hidden"
              name="endTime"
              value={new Date(selectedEndDate).toISOString()}
            />
            {selectedCoachIds.map((id) => (
              <input key={id} type="hidden" name="coachId" value={id} />
            ))}

            <div className="space-y-4">
              {/* Coach Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Coach</Label>
                <MultiSelect
                  placeholder="Select coaches"
                  selected={selectedCoachNames}
                  options={coachOptions}
                  onChange={(selected) => {
                    setSelectedCoachNames(selected);
                    setSelectedCoachIds(
                      selected.map((name) => coachMap.get(name) || "")
                    );
                  }}
                />
                {state?.errors &&
                typeof state.errors === "object" &&
                "coachId" in state.errors ? (
                  <p className="text-destructive text-sm">
                    {(state.errors as any).coachId}
                  </p>
                ) : null}
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <DatePicker
                  date={new Date(selectedStartDate)}
                  onSelect={handleDateSelect}
                />
              </div>

              {/* Time Pickers (Start & End) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-time" className="text-sm font-medium">
                    Start Time
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="edit-start-time"
                      type="time"
                      value={startTimeValue}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="pl-9 w-full"
                    />
                  </div>
                  {state?.errors &&
                  typeof state.errors === "object" &&
                  "startTime" in state.errors ? (
                    <p className="text-destructive text-sm">
                      {(state.errors as any).startTime}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-end-time" className="text-sm font-medium">
                    End Time
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="edit-end-time"
                      type="time"
                      value={endTimeValue}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className={cn(
                        "pl-9 w-full",
                        isInvalidTimeRange && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  </div>
                  {isInvalidTimeRange && (
                    <p className="text-destructive text-xs font-medium">
                      End time must be after start time
                    </p>
                  )}
                  {state?.errors &&
                  typeof state.errors === "object" &&
                  "endTime" in state.errors ? (
                    <p className="text-destructive text-sm">
                      {(state.errors as any).endTime}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Duration Custom Input & Presets */}
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-duration" className="text-sm font-medium">
                    Duration
                  </Label>
                  <span className="text-xs text-muted-foreground font-medium">
                    {!isInvalidTimeRange ? formatDurationLabel(currentDurationMinutes) : "Invalid"}
                  </span>
                </div>

                <div className="relative">
                  <Input
                    id="edit-duration"
                    type="number"
                    min={5}
                    step={5}
                    value={!isInvalidTimeRange && currentDurationMinutes > 0 ? currentDurationMinutes : ""}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                    placeholder="Enter minutes (e.g. 50)"
                    className="w-full pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                    mins
                  </span>
                </div>

                {/* Preset quick buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground mr-0.5">Presets:</span>
                  {DURATION_PRESETS.map((preset) => {
                    const isActive = currentDurationMinutes === preset && !isInvalidTimeRange;
                    return (
                      <Button
                        key={preset}
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-7 px-2.5 text-xs font-medium cursor-pointer transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "hover:bg-accent"
                        )}
                        onClick={() => handleDurationChange(preset)}
                      >
                        {preset}m
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Live Schedule Summary Preview */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Schedule Preview
                </Label>
                <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-1 text-sm shadow-xs">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {format(new Date(selectedStartDate), "hh:mm a")} –{" "}
                      {format(new Date(selectedEndDate), "hh:mm a")}
                    </span>
                  </div>
                  {!isInvalidTimeRange ? (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {formatDurationBadge(currentDurationMinutes)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                      Invalid range
                    </span>
                  )}
                </div>
              </div>
            </div>

            {state?.errors &&
              typeof state.errors === "object" &&
              "message" in state.errors &&
              (state.errors as { message?: string }).message && (
                <p className="text-destructive text-sm mt-3">
                  {(state.errors as { message?: string }).message}
                </p>
              )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
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
                disabled={pending || isInvalidTimeRange}
                variant="default"
              >
                {pending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
