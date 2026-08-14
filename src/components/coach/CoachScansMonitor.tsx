"use client";

import { useState, useEffect, useCallback } from "react";
import { useCoachApi } from "@/hooks/useCoachApi";
import { useAppSelector } from "@/lib/hooks";
import type { RootState } from "@/lib/store/store";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PaymentDatePicker } from "@/components/ui/payments/date-picker";
import { cn } from "@/lib/utils";
import {
  Clock,
  Users,
  UserCheck,
  Loader2,
  RefreshCw,
  CalendarX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { telHref } from "@/lib/utils/phone";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  createTmsSocket,
  formatFailedScanToast,
  type FailedScanPayload,
} from "@/lib/socket";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoachScan {
  memberId?: string;
  member: string;
  phone: string;
  time: string;
  method: string;
  status: "SUCCESS" | "FAILED" | "WILL_PAY";
}

interface CoachClassScanData {
  scheduledClassId: string;
  classTitle: string;
  category: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  scans: CoachScan[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime12h(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

function statusLabel(status: CoachScan["status"]) {
  switch (status) {
    case "SUCCESS":
      return "Checked in";
    case "FAILED":
      return "Failed";
    default:
      return "Will pay";
  }
}

function statusColor(status: CoachScan["status"]) {
  switch (status) {
    case "SUCCESS":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "FAILED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  }
}

// ─── PT Attendance Card ───────────────────────────────────────────────────────

function PtAttendanceCard({
  scans,
  onSelect,
}: {
  scans: CoachScan[];
  onSelect: (scan: CoachScan) => void;
}) {
  const successCount = scans.filter((s) => s.status === "SUCCESS").length;

  return (
    <Card className="w-full col-span-full">
      <CardHeader className="p-4">
        <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{scans.length} scanned</span>
          </div>
          <div className="flex items-center gap-1">
            <UserCheck className="h-4 w-4" />
            <span>{successCount} checked in</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[250px] rounded-md border">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No PT check-ins yet
                    </TableCell>
                  </TableRow>
                ) : (
                  scans.map((scan, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer"
                      onClick={() => onSelect(scan)}
                    >
                      <TableCell className="font-medium">{scan.member}</TableCell>
                      <TableCell>{scan.phone}</TableCell>
                      <TableCell>
                        {format(new Date(scan.time), "hh:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn("font-normal", statusColor(scan.status))}>
                          {statusLabel(scan.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Class Scan Card ──────────────────────────────────────────────────────────

function ClassScanCard({
  data,
  onSelect,
}: {
  data: CoachClassScanData;
  onSelect: (scan: CoachScan) => void;
}) {
  const successCount = data.scans.filter((s) => s.status === "SUCCESS").length;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{data.classTitle}</h3>
            <Badge variant="outline" className="mt-1 font-normal text-xs">
              {data.category}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime12h(data.startTime)} – {formatTime12h(data.endTime)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{data.bookedCount} / {data.capacity} booked</span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              <span>{successCount} checked in</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[250px] rounded-md border">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Member</TableHead>
                  <TableHead className="w-[25%]">Phone</TableHead>
                  <TableHead className="w-[25%]">Check-in Time</TableHead>
                  <TableHead className="w-[15%] text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.scans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No members checked in yet
                    </TableCell>
                  </TableRow>
                ) : (
                  data.scans.map((scan, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer"
                      onClick={() => onSelect(scan)}
                    >
                      <TableCell className="font-medium truncate max-w-0">{scan.member}</TableCell>
                      <TableCell className="text-muted-foreground">{scan.phone}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(scan.time), "hh:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn("font-normal", statusColor(scan.status))}>
                          {statusLabel(scan.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CoachScansMonitor() {
  const coachApi = useCoachApi();
  const hasPtSessions = useAppSelector((state: RootState) => state.coach.hasPtSessions);
  const token = useAppSelector((state: RootState) => state.coach.token);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<CoachClassScanData[]>([]);
  const [ptScans, setPtScans] = useState<CoachScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peek, setPeek] = useState<CoachScan | null>(null);

  const fetchAll = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const requests: Promise<any>[] = [
        coachApi.get(`/api/coach/scans?date=${dateStr}`),
      ];
      if (hasPtSessions) {
        requests.push(coachApi.get(`/api/coach/pt-attendance?date=${dateStr}`));
      }
      const [scansRes, ptRes] = await Promise.all(requests);
      setClasses(scansRes.data.data ?? []);
      setPtScans(hasPtSessions && ptRes ? ptRes.data.data ?? [] : []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load scans monitor.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [coachApi, hasPtSessions]);

  // Fetch on mount and date change
  useEffect(() => {
    fetchAll(selectedDate);
  }, [selectedDate, fetchAll]);

  // Real-time: refresh on any scan event
  useEffect(() => {
    const socket = createTmsSocket(token);
    const handleRefresh = () => fetchAll(selectedDate);
    const handleFailedScan = (payload: FailedScanPayload) => {
      toast.error(formatFailedScanToast(payload));
      handleRefresh();
    };

    socket.on("SUCCESS-SCAN", handleRefresh);
    socket.on("FAILED-SCAN", handleFailedScan);

    return () => {
      socket.off("SUCCESS-SCAN", handleRefresh);
      socket.off("FAILED-SCAN", handleFailedScan);
      socket.disconnect();
    };
  }, [selectedDate, fetchAll, token]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) setSelectedDate(date);
  };

  const isEmpty = classes.length === 0 && ptScans.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────

  const peekTel = peek ? telHref(peek.phone) : undefined;
  const showInitialSpinner = loading && !hasLoaded;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b pb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedDate(new Date())}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchAll(selectedDate)}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
        <PaymentDatePicker
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      </div>

      {showInitialSpinner ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm">Loading scans...</p>
        </div>
      ) : error && isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-destructive">
          <CalendarX className="mb-3 h-10 w-10 opacity-60" />
          <p className="text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fetchAll(selectedDate)}
          >
            Try Again
          </Button>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarX className="mb-3 h-10 w-10 opacity-50" />
          <p className="text-sm">No scans or classes for this date.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {hasPtSessions && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Personal Training
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <PtAttendanceCard scans={ptScans} onSelect={setPeek} />
              </div>
            </div>
          )}

          {classes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Scheduled Classes
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {classes.map((cls) => (
                  <ClassScanCard
                    key={cls.scheduledClassId}
                    data={cls}
                    onSelect={setPeek}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!peek} onOpenChange={(open) => !open && setPeek(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{peek?.member}</DialogTitle>
            <DialogDescription>
              {peek ? statusLabel(peek.status) : ""}
              {peek ? ` · ${format(new Date(peek.time), "hh:mm a")}` : ""}
            </DialogDescription>
          </DialogHeader>
          {peek && (
            <div className="space-y-3 text-sm">
              {peekTel ? (
                <a href={peekTel} className="text-muted-foreground hover:underline">
                  {peek.phone}
                </a>
              ) : (
                <p className="text-muted-foreground">{peek.phone}</p>
              )}
              {peek.memberId && hasPtSessions && (
                <Button asChild size="sm">
                  <Link
                    href={`/coach/clients/${peek.memberId}?name=${encodeURIComponent(peek.member)}`}
                    onClick={() => setPeek(null)}
                  >
                    View client
                  </Link>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
