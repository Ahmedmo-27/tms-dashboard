"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { scheduleClassAction } from "@/lib/actions/schedule-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MultiSelect } from "../../multiselect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Clock, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ApiError } from "@/core/api-error";
import type { Location } from "@/lib/data/locations";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: any | null;
  defaultValues?: {
    clsId: string;
    coachId: string[];
    startTime: string;
    endTime: string;
    availableSlots: string;
    locationId: string;
  };
}

export function ScheduleClass({
  classIdsMap,
  date,
  coaches,
  locations = [],
  defaultLocationId = "",
}: {
  classIdsMap: Map<string, string>;
  date?: Date;
  coaches: any[];
  locations?: Location[];
  defaultLocationId?: string;
}) {
  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      clsId: "",
      coachId: [],
      startTime: "",
      endTime: "",
      availableSlots: "",
      locationId: defaultLocationId,
    },
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [classPopoverOpen, setClassPopoverOpen] = useState(false);
  const [classSearch, setClassSearch] = useState("");

  const selectedClassTitle = useMemo(() => {
    if (!selectedClass) return "";
    for (const [title, id] of classIdsMap.entries()) {
      if (id === selectedClass) return title;
    }
    return "";
  }, [classIdsMap, selectedClass]);

  const filteredClasses = useMemo(() => {
    const entries = Array.from(classIdsMap.entries());
    const q = classSearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(([title]) => title.toLowerCase().includes(q));
  }, [classIdsMap, classSearch]);

  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [selectedCoachNames, setSelectedCoachNames] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState(
    defaultLocationId
  );
  const [timeString, setTimeString] = useState<string>(() => {
    if (date && (date.getHours() !== 0 || date.getMinutes() !== 0)) {
      return format(date, "HH:mm");
    }
    return "10:00";
  });

  useEffect(() => {
    if (date && (date.getHours() !== 0 || date.getMinutes() !== 0)) {
      setTimeString(format(date, "HH:mm"));
    }
  }, [date]);

  const { startDateTime, endDateTime } = useMemo(() => {
    const base = date ? new Date(date) : new Date();
    const [hStr, mStr] = (timeString || "10:00").split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);

    const start = new Date(base);
    start.setHours(isNaN(h) ? 10 : h, isNaN(m) ? 0 : m, 0, 0);

    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration default
    return { startDateTime: start, endDateTime: end };
  }, [date, timeString]);

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        className: formData.get("className") as string,
        clsId: formData.get("clsId") as string,
        coachId: formData.getAll("coachId") as string[],
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
        availableSlots: Number(formData.get("availableSlots") as string),
        locationId: formData.get("locationId") as string,
      };
      const result = await scheduleClassAction(currentState, formData);
      if (result.success) {
        setIsOpen(false);
        setSelectedClass("");
        setClassSearch("");
        setClassPopoverOpen(false);
        setSelectedLocationId(defaultLocationId);
        return initialState;
      }

      return {
        ...result,
        defaultValues,
      };
    },
    initialState
  );

  const coachOptions = coaches.map((c) => c.coachName);
  const coachMap = new Map(coaches.map((c) => [c.coachName, c._id]));

  return (
    
    <div>
      <Button
        onClick={() => {
          setSelectedLocationId(defaultLocationId);
          setIsOpen(true);
        }}
        disabled={
          !date || date.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
        }
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Schedule Class</span>
        <span className="sm:hidden">Schedule</span>
      </Button>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            setSelectedLocationId(defaultLocationId);
          } else {
            setClassPopoverOpen(false);
            setClassSearch("");
          }
        }}
      >
        <DialogContent className="z-50 max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Scheduling a class
            </DialogTitle>
            <DialogDescription>Add class data</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="mt-4">
            <input type="hidden" name="clsId" value={selectedClass} />
            <input type="hidden" name="locationId" value={selectedLocationId} />
            <input
              type="hidden"
              name="startTime"
              value={startDateTime.toString()}
            />
            <input
              type="hidden"
              name="endTime"
              value={endDateTime.toString()}
            />
            <input type="hidden" name="className" defaultValue={"Test Name"} />
            {selectedCoachIds.map((id) => (
              <input key={id} type="hidden" name="coachId" value={id} />
            ))}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Class</Label>
                <Popover
                  open={classPopoverOpen}
                  onOpenChange={setClassPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={classPopoverOpen}
                      disabled={pending}
                      className={cn(
                        "w-full justify-between items-center h-9 px-3 text-left font-normal cursor-pointer",
                        !selectedClass && "text-muted-foreground"
                      )}
                    >
                      <span className="truncate">
                        {selectedClassTitle || "Select a class"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-[100] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] sm:max-w-[480px] p-0"
                    align="start"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => {
                      e.preventDefault();
                      setClassPopoverOpen(false);
                    }}
                  >
                    <Command shouldFilter={false} className="h-auto">
                      <CommandInput
                        placeholder="Search class by name..."
                        value={classSearch}
                        onValueChange={setClassSearch}
                      />
                      <CommandList className="max-h-[260px] overflow-y-auto">
                        {filteredClasses.length === 0 ? (
                          <CommandEmpty>No classes found.</CommandEmpty>
                        ) : null}
                        <CommandGroup>
                          {filteredClasses.map(([title, id]) => {
                            const isSelected = id === selectedClass;
                            return (
                              <CommandItem
                                key={id}
                                value={id}
                                onSelect={() => {
                                  setSelectedClass(id);
                                  setClassPopoverOpen(false);
                                  setClassSearch("");
                                }}
                                className="cursor-pointer py-2"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    isSelected
                                      ? "opacity-100 text-primary"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="truncate">{title}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {state?.errors &&
                typeof state.errors == "object" &&
                "clsId" in state.errors ? (
                  <p className="text-destructive text-sm">
                    {(state.errors as any).clsId}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <Select
                  value={selectedLocationId || undefined}
                  disabled={pending}
                  onValueChange={setSelectedLocationId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        No locations available
                      </SelectItem>
                    ) : (
                      locations.map((location) => (
                        <SelectItem
                          key={location._id}
                          value={location._id}
                          className="hover:bg-accent"
                        >
                          {location.branchName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {state?.errors &&
                typeof state.errors == "object" &&
                "locationId" in state.errors ? (
                  <p className="text-destructive text-sm">
                    {(state.errors as any).locationId}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
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
                typeof state.errors == "object" &&
                "coachId" in state.errors ? (
                  <p className="text-destructive text-sm">
                    {(state.errors as any).coachId}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-start-time" className="text-sm font-medium">
                  Start Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="class-start-time"
                    type="time"
                    value={timeString}
                    onChange={(e) => setTimeString(e.target.value)}
                    className="pl-9 w-full"
                    required
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Class Schedule (1 Hour)
                </Label>
                <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-1 text-sm shadow-xs">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      {format(startDateTime, "hh:mm a")} – {format(endDateTime, "hh:mm a")}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                    1 hr default
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
