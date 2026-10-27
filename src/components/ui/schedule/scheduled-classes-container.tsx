import { useState } from "react";
import { ScheduledClass, getColumns } from "./columns";
import { DataTable } from "./data-table";
import { ScheduleClass } from "../dialogs/schedule/schedule-class";
import { BookMemberClassDialog } from "../dialogs/schedule/book-member-class";
import { AddToWaitlistDialog } from "../dialogs/schedule/add-to-waitlist-dialog";
import { MobileScheduledClassCard } from "./mobile-scheduled-class-card";
import type { Location } from "@/lib/data/locations";
import { Package } from "@/components/ui/packages/columns";
import { Button } from "../button";
import { Clock } from "lucide-react";

export function ScheduledClassesContainer({
  scheduledClasses,
  allScheduledClasses,
  classIdsMap,
  classDurationMap,
  date,
  isLoading = false,
  coaches,
  locations,
  defaultLocationId,
  catalogPackages,
}: {
  scheduledClasses: ScheduledClass[];
  allScheduledClasses: ScheduledClass[];
  classIdsMap: Map<string, string>;
  classDurationMap?: Map<string, number>;
  isLoading?: boolean;
  date: Date;
  coaches: any[];
  locations: Location[];
  defaultLocationId?: string;
  catalogPackages: Package[];
}) {
  const [openWaitlistDialog, setOpenWaitlistDialog] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Header - responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 px-1" data-walkthrough="schedule-calendar-header">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">Scheduled Classes</h2>
          <p className="text-sm text-muted-foreground">
            {scheduledClasses.length} classes scheduled for selected day
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            className="h-9 gap-1.5 cursor-pointer text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
            onClick={() => setOpenWaitlistDialog(true)}
          >
            <Clock className="h-4 w-4 text-amber-500" />
            Add to Waitlist
          </Button>
          <AddToWaitlistDialog
            open={openWaitlistDialog}
            onOpenChange={setOpenWaitlistDialog}
            scheduledClasses={scheduledClasses}
          />
          <BookMemberClassDialog
            scheduledClasses={scheduledClasses}
            allScheduledClasses={allScheduledClasses}
            catalogPackages={catalogPackages}
            date={date}
          />
          <div data-walkthrough="schedule-add-class-btn">
            <ScheduleClass
              classIdsMap={classIdsMap}
              classDurationMap={classDurationMap}
              date={date}
              coaches={coaches}
              locations={locations}
              defaultLocationId={defaultLocationId}
            />
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden flex-1 min-h-0 overflow-auto" data-walkthrough="schedule-calendar-grid">
        {isLoading ? (
          <div className="space-y-3 p-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-muted/30 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : scheduledClasses.length > 0 ? (
          <div className="space-y-3 p-1">
            {scheduledClasses.map((scheduledClass, index) => (
              <MobileScheduledClassCard
                key={scheduledClass._id || index}
                scheduledClass={scheduledClass}
                coaches={coaches}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              No classes scheduled
            </p>
            <p className="text-xs text-muted-foreground/80">
              Schedule a class to get started
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block flex-1 min-h-0 overflow-auto" data-walkthrough="schedule-calendar-grid">
        <DataTable
          columns={getColumns(coaches)}
          data={scheduledClasses}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
