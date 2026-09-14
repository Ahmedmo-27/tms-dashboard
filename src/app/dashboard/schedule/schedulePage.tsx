"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ScheduledClassesContainer } from "@/components/ui/schedule/scheduled-classes-container";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import type { Location } from "@/lib/data/locations";
import { useBranchContext } from "@/lib/hooks/use-branch-context";
import { Package } from "@/components/ui/packages/columns";
import { getScheduledClasses } from "@/lib/data/schedule";
import { formatInTimeZone } from "date-fns-tz";
import toast from "react-hot-toast";

interface SchedulePageProps {
  scheduledClasses: ScheduledClass[];
  classIdsMap: Map<string, string>;
  coaches: any[];
  locations: Location[];
  initialLocationId?: string;
  initialDate?: string;
  catalogPackages: Package[];
}

export function SchedulePage({
  classIdsMap,
  coaches,
  scheduledClasses: initialScheduledClasses,
  locations,
  initialLocationId = "",
  initialDate,
  catalogPackages,
}: SchedulePageProps) {
  const { isManagement, isViewingAllBranches } = useBranchContext();
  const initialLocation =
    locations.find((l) => l._id === initialLocationId) ?? locations[0];
  const [date, setDate] = useState<Date>(() =>
    initialDate ? new Date(initialDate) : new Date()
  );
  const [classes, setClasses] = useState<ScheduledClass[]>(
    initialScheduledClasses
  );
  const [isLoading, setIsLoading] = useState(false);
  const [branchLocation, setBranchLocation] = useState<string>(
    initialLocation?.branchName ?? ""
  );

  useEffect(() => {
    setClasses(initialScheduledClasses);
  }, [initialScheduledClasses]);

  const managementLocation = initialLocationId
    ? locations.find((l) => l._id === initialLocationId)
    : undefined;
  const location = isManagement
    ? (managementLocation?.branchName ?? "")
    : branchLocation;
  const selectedLocationId = isManagement
    ? (initialLocationId || "")
    : (locations.find((l) => l.branchName === branchLocation)?._id ??
      locations[0]?._id ??
      "");
  const selectedLocationName = isManagement
    ? (managementLocation?.branchName ?? "")
    : branchLocation;

  const fetchSchedule = useCallback(
    async (targetDate: Date, locId?: string) => {
      setIsLoading(true);
      try {
        const dateStr = formatInTimeZone(
          targetDate,
          "Africa/Cairo",
          "yyyy-MM-dd"
        );
        const effectiveLocId =
          isManagement && isViewingAllBranches ? undefined : locId || undefined;
        const data = await getScheduledClasses(effectiveLocId, dateStr);
        setClasses(data);
      } catch (error) {
        console.error("Failed to load schedule for date", error);
        toast.error("Failed to load schedule for selected date");
      } finally {
        setIsLoading(false);
      }
    },
    [isManagement, isViewingAllBranches]
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    const dateStr = formatInTimeZone(
      selectedDate,
      "Africa/Cairo",
      "yyyy-MM-dd"
    );
    if (typeof window !== "undefined") {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("date", dateStr);
      const newUrl = `/dashboard/schedule?${currentParams.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
    fetchSchedule(selectedDate, selectedLocationId || undefined);
  };

  const handleBranchChange = (newBranchName: string) => {
    setBranchLocation(newBranchName);
    const foundLoc = locations.find((l) => l.branchName === newBranchName);
    const locId = foundLoc?._id;
    fetchSchedule(date, locId);
  };

  const selectedScheduledClasses = useMemo(() => {
    const targetDateStr = formatInTimeZone(
      date,
      "Africa/Cairo",
      "yyyy-MM-dd"
    );
    return classes.filter((cls) => {
      const clsDateStr = formatInTimeZone(
        new Date(cls.startTime),
        "Africa/Cairo",
        "yyyy-MM-dd"
      );
      if (clsDateStr !== targetDateStr) return false;
      if (isManagement && isViewingAllBranches) return true;
      return (
        cls.locationId === selectedLocationId ||
        (!cls.locationId && cls.location === selectedLocationName)
      );
    });
  }, [
    classes,
    date,
    selectedLocationId,
    selectedLocationName,
    isManagement,
    isViewingAllBranches,
  ]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-w-0 flex-col-reverse gap-4 overflow-y-auto overflow-x-hidden p-3 md:flex-row">
      <div className="h-full min-w-0 flex-[2]">
        <ScheduledClassesContainer
          scheduledClasses={selectedScheduledClasses}
          allScheduledClasses={classes}
          classIdsMap={classIdsMap}
          date={date || new Date()}
          isLoading={isLoading}
          coaches={coaches}
          locations={locations}
          defaultLocationId={selectedLocationId}
          catalogPackages={catalogPackages}
        />
      </div>

      {/* Right side - Calendar and Members */}
      <div className="flex min-w-0 max-w-[350px] flex-1 shrink-0 flex-col gap-3 md:min-w-[240px] lg:min-w-[280px]">
        <div className="h-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            className="rounded-md border bg-card"
            classNames={{
              months:
                "flex flex-col sm:flex-row space-y-1 sm:space-x-1 sm:space-y-0",
              month: "space-y-2",
              caption: "flex justify-center relative items-center h-8",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button:
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
              row: "flex w-full mt-1",
              cell: "text-center text-sm relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-8 w-8",
              day: "h-8 w-8 p-0 font-normal",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </div>
        {!isManagement && (
          <div className="flex flex-col gap-2">
            {locations.length > 1 ? (
              <Select
                name="location"
                value={location}
                onValueChange={handleBranchChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem
                      key={loc._id}
                      value={loc.branchName}
                      className="hover:bg-accent"
                    >
                      {loc.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : locations[0] ? (
              <p className="text-sm text-muted-foreground px-1">
                Branch: {locations[0].branchName}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
