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
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { editClassAction } from "@/lib/actions/schedule-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const isReformer = useMemo(() => {
    return /reformer/i.test(scheduledClass?.className || "");
  }, [scheduledClass?.className]);

  const defaultDurationMinutes = useMemo(() => {
    return getDefaultClassDurationMinutes(scheduledClass?.className);
  }, [scheduledClass?.className]);

  const defaultDurationMs = defaultDurationMinutes * 60 * 1000;

  const getDurationMs = () => {
    const s = new Date(selectedStartDate).getTime();
    const e = new Date(selectedEndDate).getTime();
    const diff = e - s;
    if (!isNaN(diff) && diff > 0) {
      if (isReformer && diff === 60 * 60 * 1000) {
        return defaultDurationMs;
      }
      return diff;
    }
    return defaultDurationMs;
  };

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
    let endStr = scheduledClass?.endTime?.toString() || new Date().toString();
    if (isReformer && scheduledClass?.startTime && scheduledClass?.endTime) {
      const s = new Date(scheduledClass.startTime).getTime();
      const e = new Date(scheduledClass.endTime).getTime();
      if (e - s === 60 * 60 * 1000) {
        endStr = new Date(s + defaultDurationMs).toString();
      }
    }
    setSelectedStartDate(startStr);
    setSelectedEndDate(endStr);
  }, [isOpen, scheduledClass, isReformer, defaultDurationMs]);

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

  const currentDurationMinutes = useMemo(() => {
    const s = new Date(selectedStartDate).getTime();
    const e = new Date(selectedEndDate).getTime();
    const diff = e - s;
    if (!isNaN(diff) && diff > 0) {
      return Math.round(diff / (60 * 1000));
    }
    return defaultDurationMinutes;
  }, [selectedStartDate, selectedEndDate, defaultDurationMinutes]);

  const handleStartTimeChange = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const start = new Date(selectedStartDate);
    start.setHours(isNaN(h) ? 10 : h, isNaN(m) ? 0 : m, 0, 0);
    const duration = getDurationMs();
    const end = new Date(start.getTime() + duration);
    setSelectedStartDate(start.toString());
    setSelectedEndDate(end.toString());
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
        <DialogContent onClick={(e) => e.stopPropagation()}>
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
            value={selectedStartDate}
          />
          <input
            type="hidden"
            name="endTime"
            value={selectedEndDate}
          />
          <div className="grid grid-cols-2 gap-6">
            {selectedCoachIds.map((id) => (
              <input key={id} type="hidden" name="coachId" value={id} />
            ))}
            <div className="space-y-6 col-span-2">
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
              typeof state.errors == "object" &&
              "coachId" in state.errors ? (
                <p className="text-destructive text-sm">
                  {(state.errors as any).coachId}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <DatePicker
                date={new Date(selectedStartDate)}
                onSelect={(newDate) => {
                  if (newDate) {
                    const prev = new Date(selectedStartDate);
                    const updatedStart = new Date(newDate);
                    updatedStart.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                    const duration = getDurationMs();
                    const updatedEnd = new Date(updatedStart.getTime() + duration);
                    setSelectedStartDate(updatedStart.toString());
                    setSelectedEndDate(updatedEnd.toString());
                  }
                }}
              />
            </div>

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
              typeof state.errors == "object" &&
              "startTime" in state.errors ? (
                <p className="text-destructive text-sm">
                  {(state.errors as any).startTime}
                </p>
              ) : null}
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Class Schedule ({formatDurationLabel(currentDurationMinutes)})
              </Label>
              <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-1 text-sm shadow-xs">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>
                    {format(new Date(selectedStartDate), "hh:mm a")} –{" "}
                    {format(new Date(selectedEndDate), "hh:mm a")}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                  {formatDurationBadge(currentDurationMinutes)}
                </span>
              </div>
              {state?.errors &&
              typeof state.errors == "object" &&
              "endTime" in state.errors ? (
                <p className="text-destructive text-sm">
                  {(state.errors as any).endTime}
                </p>
              ) : null}
            </div>
          </div>
          {state?.errors &&
            typeof state.errors === "object" &&
            "message" in state.errors &&
            (state.errors as { message?: string }).message && (
              <p className="text-destructive text-sm mt-4">
                {(state.errors as { message?: string }).message}
              </p>
            )}
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
    </>
  );
}
