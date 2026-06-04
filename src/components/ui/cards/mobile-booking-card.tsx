import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { Booking } from "../members/columns";
import CancelBookingDialog from "../dialogs/member-bookings/cancel-booking";

interface MobileBookingCardProps {
  booking: Booking;
  uid: string;
}

export function MobileBookingCard({ booking, uid }: MobileBookingCardProps) {
  const formatDateTime = (date: string | Date) => {
    if (!date || date === "") return {
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

  const classDateTime = formatDateTime(booking.classTime);
  const bookingDateTime = formatDateTime(booking.bookingTime);

  // Determine if the class is upcoming, ongoing, or past
  const now = new Date();
  const classDate = new Date(booking.classTime);
  const isUpcoming = classDate > now;
  const isPast = classDate < now;

  return (
    <Card className="w-full hover:shadow-md transition-shadow touch-manipulation">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with class name and status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
              <h3 className="font-semibold text-sm truncate">
                {booking.className}
              </h3>
            </div>
            <Badge 
              variant={isUpcoming ? "default" : isPast ? "secondary" : "outline"}
              className="text-xs"
            >
              {isUpcoming ? "Upcoming" : isPast ? "Past" : "Today"}
            </Badge>
          </div>

          {/* Class schedule information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Class Schedule</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{classDateTime.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{classDateTime.time}</span>
              </div>
            </div>
          </div>

          {/* Booking information */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Booked On</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{bookingDateTime.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{bookingDateTime.time}</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          {isUpcoming && (
            <div className="pt-2 border-t">
              <CancelBookingDialog
                scid={booking.scid}
                uid={uid}
                title={booking.className}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
