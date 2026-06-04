import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { Calendar, Clock, Dumbbell } from "lucide-react";

interface MobilePTAttendanceCardProps {
  attendance: {
    package: string;
    attendanceTime: string;
  };
  index: number;
}

export function MobilePTAttendanceCard({ attendance, index }: MobilePTAttendanceCardProps) {
  const formatDateTime = (date: string) => {
    if (date === "" || !date) return {
      time: "",
      date: ""
    };

    const d = new Date(date);
    const dateTime = {
      time: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      date: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    return dateTime;
  };

  const attendanceTime = formatDateTime(attendance.attendanceTime.toString());

  return (
    <Card className="w-full hover:shadow-md transition-shadow touch-manipulation">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with package name */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Dumbbell className="h-4 w-4 text-primary flex-shrink-0" />
              <h3 className="font-semibold text-sm truncate">
                {attendance.package}
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              Completed
            </Badge>
          </div>

          {/* Attendance time information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Attendance Time</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{attendanceTime.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{attendanceTime.time}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
