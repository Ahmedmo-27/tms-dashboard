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

interface SchedulePageProps {
  scheduledClasses: ScheduledClass[];
  classIdsMap: Map<string, string>;
  coaches: any[];
  locations: string[];
}

export function SchedulePage({
  classIdsMap,
  coaches,
  scheduledClasses,
  locations,
}: SchedulePageProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>(locations[0]);
  const [selectedScheduledClasses, setSelectedScheduledClasses] = useState<
    ScheduledClass[]
  >([]);

  useEffect(() => {
    const targetDateStr = date.toLocaleDateString();
    const targetLocation = location;
    const filtered = scheduledClasses.filter((cls) => {
      const clsDateStr = new Date(cls.startTime).toLocaleDateString();
      return clsDateStr === targetDateStr && cls.location === targetLocation;
    });

    setSelectedScheduledClasses(filtered);
  }, [scheduledClasses, date, location]);
  return (
    <div className="flex flex-col-reverse overflow-y-auto md:flex-row h-[calc(100vh-4rem)] gap-4 p-3">
      <div className="flex-[2] h-full">
        <ScheduledClassesContainer
          scheduledClasses={selectedScheduledClasses}
          classIdsMap={classIdsMap}
          date={date || new Date()}
          coaches={coaches}
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
        <div className="flex flex-col gap-2">
          <Select
            name="location"
            defaultValue={location}
            onValueChange={(value) => setLocation(value as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem
                  key={location}
                  value={location}
                  className="hover:bg-accent"
                >
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
