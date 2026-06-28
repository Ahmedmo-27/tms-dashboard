"use client";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ScheduledClassesContainer } from "@/components/ui/schedule/scheduled-classes-container";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import EditSlots from "@/components/ui/dialogs/schedule/edit-slots";
import { format } from "date-fns";
import { EditClassComponent } from "@/components/ui/dialogs/schedule/edit-class";
import type { Location } from "@/lib/data/locations";
import { useBranchContext } from "@/lib/hooks/use-branch-context";

interface SchedulePageProps {
  scheduledClasses: ScheduledClass[];
  classIdsMap: Map<string, string>;
  coaches: any[];
  locations: Location[];
  initialLocationId?: string;
}

export function SchedulePage({
  classIdsMap,
  coaches,
  scheduledClasses,
  locations,
  initialLocationId = "",
}: SchedulePageProps) {
  const { isManagement } = useBranchContext();
  const initialLocation =
    locations.find((l) => l._id === initialLocationId) ?? locations[0];
  const [date, setDate] = useState<Date>(new Date());
  const [branchLocation, setBranchLocation] = useState<string>(
    initialLocation?.branchName ?? ""
  );

  const managementLocation =
    locations.find((l) => l._id === initialLocationId) ?? locations[0];
  const location = isManagement
    ? (managementLocation?.branchName ?? "")
    : branchLocation;
  const selectedLocationId = isManagement
    ? (initialLocationId ?? locations[0]?._id ?? "")
    : (locations.find((l) => l.branchName === branchLocation)?._id ??
      locations[0]?._id ??
      "");
  const [selectedScheduledClasses, setSelectedScheduledClasses] = useState<
    ScheduledClass[]
  >([]);

  useEffect(() => {
    const targetDateStr = date.toLocaleDateString();
    const targetLocation = location;
    const filtered = scheduledClasses.filter((cls) => {
      const clsDateStr = new Date(cls.startTime).toLocaleDateString();
      const locationMatch =
        cls.locationId === selectedLocationId ||
        cls.location === targetLocation;
      return clsDateStr === targetDateStr && locationMatch;
    });

    setSelectedScheduledClasses(filtered);
  }, [scheduledClasses, date, location, selectedLocationId]);
  return (
    <div className="flex flex-col-reverse overflow-y-auto md:flex-row h-[calc(100vh-4rem)] gap-4 p-3">
      <div className="flex-[2] h-full">
        <ScheduledClassesContainer
          scheduledClasses={selectedScheduledClasses}
          classIdsMap={classIdsMap}
          date={date || new Date()}
          coaches={coaches}
          locations={locations}
          defaultLocationId={selectedLocationId}
        />
      </div>

      {/* Right side - Calendar and Members */}
      <div className="flex flex-1 min-w-[280px] max-w-[350px] flex-col gap-3">
        <div className="h-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d: Date) => d && setDate(d)}
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
                onValueChange={(value) => setBranchLocation(value as string)}
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
