"use client";

import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import { Calendar, Clock, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobilePTAttendanceCard } from "./mobile-pt-attendance-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

interface PTAttendanceRecord {
  package: string;
  attendanceTime: string;
}

interface PTAttendanceProps {
  attendance: PTAttendanceRecord[];
}

export default function PTAttendance({ attendance }: PTAttendanceProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredAttendance = useMemo(() => {
    if (!fromDate && !toDate) return attendance;
    return attendance.filter((rec) => {
      const d = new Date(rec.attendanceTime).getTime();
      const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
      const to = toDate ? new Date(toDate + "T23:59:59").getTime() : Infinity;
      return d >= from && d <= to;
    });
  }, [attendance, fromDate, toDate]);

  const hasFilter = fromDate || toDate;

  const formatDateTime = (date: string) => {
    if (!date) return { time: "", date: "", dayOfWeek: "" };
    const d = new Date(date);
    return {
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
      dayOfWeek: d.toLocaleDateString("en-US", { weekday: "short" }),
    };
  };

  return (
    <Card className="flex-1 border border-border/40 shadow-sm">
      <CardHeader className="">
        <h3 className="text-base font-semibold">PT Attendance</h3>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {/* Date filter */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-7 text-xs w-36"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-7 text-xs w-36"
            />
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => { setFromDate(""); setToDate(""); }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden">
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {hasFilter
                  ? "No attendance records for the selected period"
                  : "No attendance found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAttendance.map((record, index) => (
                <MobilePTAttendanceCard
                  key={index}
                  attendance={record}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Compact Desktop View */}
        <div className="hidden lg:block">
          <ScrollArea className="h-96 pr-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/30">
                  <TableHead className="text-xs font-medium text-muted-foreground">
                    Package
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">
                    Attendance Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="h-20 text-center text-muted-foreground text-sm"
                    >
                      {hasFilter
                        ? "No attendance records for the selected period"
                        : "No attendance found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendance.map((record, index) => {
                    const t = formatDateTime(record.attendanceTime);
                    return (
                      <TableRow
                        key={index}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="py-2 px-3 text-sm">
                          <div className="">{record.package}</div>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{t.date}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{t.time}</span>
                          </div>
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
