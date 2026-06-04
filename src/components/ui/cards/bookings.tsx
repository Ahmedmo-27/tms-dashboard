"use client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Booking } from "../members/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import CancelBookingDialog from "@/components/ui/dialogs/member-bookings/cancel-booking";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MoreHorizontal, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduledClass } from "../schedule/columns";
import BookClass from "../dialogs/member-bookings/book-class";
import BookDropIn from "../dialogs/member-bookings/book-drop-in";
import { MobileBookingCard } from "./mobile-booking-card";

export default function Bookings({
  bookings,
  scheduledClasses,
  uid,
}: {
  bookings: Booking[];
  scheduledClasses: ScheduledClass[];
  uid: string;
}) {
  const formatDateTime = (date: string) => {
    if(date === "") return {
      time: "",
      date: ""
    }
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

  return (
    <Card className="flex-1">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg sm:text-xl font-semibold">Bookings</h3>
          <div className="flex gap-2">
            <BookClass uid={uid} scheduledClasses={scheduledClasses} />
            <BookDropIn uid={uid} scheduledClasses={scheduledClasses} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Mobile view */}
        <div className="block lg:hidden">
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking, index) => (
                <MobileBookingCard key={index} booking={booking} uid={uid} />
              ))}
            </div>
          )}
        </div>

        {/* Desktop view */}
        <div className="hidden lg:block">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Class</TableHead>
                  <TableHead className="text-xs sm:text-sm">Class Schedule</TableHead>
                  <TableHead className="text-xs sm:text-sm">Booking Time</TableHead>
                  <TableHead className="w-[50px] text-xs sm:text-sm"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking, index) => {
                    const classDateTime = formatDateTime(
                      booking.classTime.toString()
                    );
                    const bookingDateTime = formatDateTime(
                      booking.bookingTime.toString()
                    );

                    return (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium text-sm py-3 px-2 sm:px-4">
                          <div className="truncate max-w-[120px]">{booking.className}</div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{classDateTime.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{classDateTime.time}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{bookingDateTime.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{bookingDateTime.time}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <CancelBookingDialog
                            scid={booking.scid}
                            uid={uid}
                            title={booking.className}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
