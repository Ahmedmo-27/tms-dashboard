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
import { MobilePTAttendanceCard } from "./mobile-pt-attendance-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";

export interface PTAttendanceRecord {
  package: string;
  attendanceTime: string;
  status?: string;
}

function renderPtStatusBadge(status?: string) {
  const norm = (status || "COMPLETED").toUpperCase();
  if (norm === "WILL_PAY" || norm === "PENDING") {
    return (
      <Badge
        variant="outline"
        className="text-xs font-semibold border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
      >
        Will Pay
      </Badge>
    );
  }
  if (norm === "FOC") {
    return (
      <Badge
        variant="outline"
        className="text-xs font-semibold border-purple-400 bg-purple-50 text-purple-800 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
      >
        FOC
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      Completed
    </Badge>
  );
}

interface PTAttendanceProps {
  attendance: PTAttendanceRecord[];
}

const PAGE_SIZE = 10;

export default function PTAttendance({
  attendance,
  hideHeader = false,
}: PTAttendanceProps & { hideHeader?: boolean }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const filteredAttendance = useMemo(() => {
    const base = !fromDate && !toDate
      ? [...attendance]
      : attendance.filter((rec) => {
          const d = new Date(rec.attendanceTime).getTime();
          const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
          const to = toDate ? new Date(toDate + "T23:59:59").getTime() : Infinity;
          return d >= from && d <= to;
        });
    return base.sort(
      (a, b) =>
        new Date(b.attendanceTime || 0).getTime() -
        new Date(a.attendanceTime || 0).getTime()
    );
  }, [attendance, fromDate, toDate]);

  const hasFilter = fromDate || toDate;
  const pageCount = Math.ceil(filteredAttendance.length / PAGE_SIZE);
  const safePageIndex =
    pageIndex >= pageCount && pageCount > 0 ? pageCount - 1 : pageIndex;
  const paginatedAttendance = filteredAttendance.slice(
    safePageIndex * PAGE_SIZE,
    (safePageIndex + 1) * PAGE_SIZE
  );

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
    <Card className={hideHeader ? "flex-1 border-0 shadow-none" : "flex-1 border border-border/40 shadow-sm"}>
      {!hideHeader && (
      <CardHeader className="">
        <h3 className="text-base font-semibold">PT Attendance</h3>
      </CardHeader>
      )}

      <CardContent className="p-3 sm:p-4">
        {/* Date filter */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPageIndex(0);
              }}
              className="h-7 text-xs w-36"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPageIndex(0);
              }}
              className="h-7 text-xs w-36"
            />
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPageIndex(0);
              }}
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
              {paginatedAttendance.map((record, index) => (
                <MobilePTAttendanceCard
                  key={safePageIndex * PAGE_SIZE + index}
                  attendance={record}
                  index={safePageIndex * PAGE_SIZE + index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Compact Desktop View */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/30">
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Package
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Attendance Time
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right pr-4">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-20 text-center text-muted-foreground text-sm"
                  >
                    {hasFilter
                      ? "No attendance records for the selected period"
                      : "No attendance found"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAttendance.map((record, index) => {
                  const t = formatDateTime(record.attendanceTime);
                  return (
                    <TableRow
                      key={safePageIndex * PAGE_SIZE + index}
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
                      <TableCell className="py-2 px-3 text-right pr-4">
                        {renderPtStatusBadge(record.status)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {filteredAttendance.length > 0 && (
          <TablePagination
            pageIndex={safePageIndex}
            pageCount={pageCount}
            total={filteredAttendance.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPageIndex}
          />
        )}
      </CardContent>
    </Card>
  );
}
