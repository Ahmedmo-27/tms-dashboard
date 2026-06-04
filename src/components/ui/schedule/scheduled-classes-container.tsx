import { ScheduledClass, getColumns } from "./columns";
import { DataTable } from "./data-table";
import { ScheduleClass } from "../dialogs/schedule/schedule-class";
import { MobileScheduledClassCard } from "./mobile-scheduled-class-card";

export function ScheduledClassesContainer({
  scheduledClasses,
  classIdsMap,
  date,
  isLoading = false,
  coaches,
}: {
  scheduledClasses: ScheduledClass[];
  classIdsMap: Map<string, string>;
  isLoading?: boolean;
  date: Date;
  coaches: any[];
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Header - responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 px-1">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">Scheduled Classes</h2>
          <p className="text-sm text-muted-foreground">
            {scheduledClasses.length} classes scheduled for selected day
          </p>
        </div>
        <div className="flex-shrink-0">
          <ScheduleClass classIdsMap={classIdsMap} date={date} coaches={coaches}/>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden flex-1 min-h-0 overflow-auto">
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
      <div className="hidden md:block flex-1 min-h-0 overflow-auto">
        <DataTable
          columns={getColumns(coaches)}
          data={scheduledClasses}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
