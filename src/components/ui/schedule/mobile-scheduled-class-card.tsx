import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { 
  Clock, 
  Users, 
  MapPin, 
  User, 
  MoreHorizontal,
  Calendar
} from "lucide-react";
import { ScheduledClass } from "./columns";
import { format } from "date-fns";
import { ShowBookedMembers } from "./show-booked-members";
import CancelClassDialog from "../dialogs/schedule/cancel-class";
import EditSlotsDialog from "../dialogs/schedule/edit-slots";
import { EditClassComponent } from "../dialogs/schedule/edit-class";
import { BookNonUserDialog } from "../dialogs/schedule/book-non-user";

interface MobileScheduledClassCardProps {
  scheduledClass: ScheduledClass;
  coaches: any[];
}

export function MobileScheduledClassCard({ 
  scheduledClass, 
  coaches 
}: MobileScheduledClassCardProps) {
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className="w-full hover:shadow-md transition-shadow touch-manipulation" 
      role="article" 
      aria-label={`Scheduled class ${scheduledClass.className}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with class name and actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {scheduledClass.className}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {scheduledClass.category}
                </Badge>
                <Badge 
                  variant={scheduledClass.availableSlots > 0 ? "default" : "destructive"} 
                  className="text-xs"
                >
                  {scheduledClass.availableSlots} slots
                </Badge>
              </div>
            </div>
            <div className="flex-shrink-0" onClick={handleDropdownClick}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Editing {scheduledClass.className}</DropdownMenuLabel>
                  <BookNonUserDialog scid={scheduledClass._id as string} />
                  <EditSlotsDialog scheduledClass={scheduledClass} />
                  <EditClassComponent scheduledClass={scheduledClass} coaches={coaches} />
                  <CancelClassDialog scls={scheduledClass} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Time and duration */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {format(scheduledClass.startTime, "HH:mm")} - {format(scheduledClass.endTime, "HH:mm")}
                  </p>
                  <p className="text-xs">
                    {Math.round((new Date(scheduledClass.endTime).getTime() - new Date(scheduledClass.startTime).getTime()) / (1000 * 60))} min
                  </p>
                </div>
              </div>
              
              {scheduledClass.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-sm">{scheduledClass.location}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate text-sm font-medium text-foreground">
                  {scheduledClass.coachName}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <ShowBookedMembers members={scheduledClass.bookedMembers} scid={scheduledClass._id} />
              </div>
            </div>
          </div>

          {/* Booked members count */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {scheduledClass.bookedMembers.length} / {scheduledClass.availableSlots + scheduledClass.bookedMembers.length} booked
              </span>
              <div className="w-full max-w-[100px] bg-muted rounded-full h-2 ml-3">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (scheduledClass.bookedMembers.length / (scheduledClass.availableSlots + scheduledClass.bookedMembers.length)) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
