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
  MapPin,
  CheckCircle2,
  ClipboardCheck,
  AlertTriangle,
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
import { CoachScansSkeleton } from "@/components/ui/loading/coach-skeletons";
import { AttendanceContainer } from "@/components/ui/scans/attendance-container";
import {
  ConfirmAttendanceDialog,
  AttendanceConfirmationData,
} from "./ConfirmAttendanceDialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoachScan {
  memberId?: string;
  member: string;
  phone: string;
  time: string;
  method: string;
  status: "SUCCESS" | "FAILED" | "WILL_PAY";
  statusDetail?: string;
  bookingId?: string;
  branchLabel?: string;
}

interface CoachClassScanData {
  scheduledClassId: string;
  classTitle: string;
  category: string;
  startTime: string;
  endTime: string;
  startTimeIso?: string;
  endTimeIso?: string;
  capacity: number;
  bookedCount: number;
  location: string | null;
  scans: CoachScan[];
  attendanceConfirmation?: AttendanceConfirmationData | null;
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

function isSessionPastHalfway(data: CoachClassScanData, now: number): boolean {
  if (data.startTimeIso && data.endTimeIso) {
    const start = new Date(data.startTimeIso).getTime();
    const end = new Date(data.endTimeIso).getTime();
    const halfway = start + (end - start) / 2;
    return now >= halfway;
  }
  try {
    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startH, startM, 0, 0);
    const endDate = new Date();
    endDate.setHours(endH, endM, 0, 0);
    const halfway = startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2;
    return now >= halfway;
  } catch {
    return false;
  }
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

// ─── Class Scan Card ──────────────────────────────────────────────────────────

function ClassScanCard({
  data,
  currentTime,
  onSelect,
  onConfirmAttendance,
}: {
  data: CoachClassScanData;
  currentTime: number;
  onSelect: (scan: CoachScan) => void;
  onConfirmAttendance: (session: CoachClassScanData) => void;
}) {
  const successCount = data.scans.filter((s) => s.status === "SUCCESS").length;
  const isHalfway = isSessionPastHalfway(data, currentTime);
  const isConfirmed = Boolean(data.attendanceConfirmation?.confirmed);

  return (
    <Card data-walkthrough="coach-class-scan-card" className="w-full">
      <CardHeader className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{data.classTitle}</h3>
              {isConfirmed ? (
                data.attendanceConfirmation?.hasMissingPlace ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 gap-1 text-xs font-normal"
                    title={`Attendance confirmed with missing place (${data.attendanceConfirmation.confirmedCount} present)`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Missing Place
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 gap-1 text-xs font-normal"
                    title={`Attendance confirmed (${data.attendanceConfirmation?.confirmedCount} present)`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Confirmed
                  </Badge>
                )
              ) : null}
            </div>
            <Badge variant="outline" className="mt-1 font-normal text-xs">
              {data.category}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime12h(data.startTime)} – {formatTime12h(data.endTime)}
              </span>
            </div>
            {data.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{data.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{data.bookedCount} / {data.capacity} booked</span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              <span>{successCount} checked in</span>
            </div>

            {/* Halfway Attendance Confirmation Button */}
            {isHalfway ? (
              isConfirmed ? (
                <Button
                  size="sm"
                  variant="outline"
                  data-walkthrough="coach-confirm-attendance-btn"
                  className={cn(
                    "h-7 text-xs font-medium gap-1.5 cursor-pointer",
                    data.attendanceConfirmation?.hasMissingPlace
                      ? "border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
                      : "border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                  )}
                  onClick={() => onConfirmAttendance(data)}
                  title="Click to view or edit attendance headcount"
                >
                  {data.attendanceConfirmation?.hasMissingPlace ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {data.attendanceConfirmation?.confirmedCount} Confirmed
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  data-walkthrough="coach-confirm-attendance-btn"
                  className="h-7 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
                  onClick={() => onConfirmAttendance(data)}
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Confirm Attendance
                </Button>
              )
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea data-walkthrough="coach-class-scans-table" className="h-[250px] rounded-md border">
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
  const hasScheduledClasses = useAppSelector((state: RootState) => state.coach.hasScheduledClasses);
  const token = useAppSelector((state: RootState) => state.coach.token);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<CoachClassScanData[]>([]);
  const [ptScans, setPtScans] = useState<CoachScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peek, setPeek] = useState<CoachScan | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [confirmingSession, setConfirmingSession] = useState<CoachClassScanData | null>(null);

  // Periodic timer so halfway buttons appear dynamically without manual reload
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

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
      const msg =
        err?.response?.data?.message ||
        err?.context?.message ||
        "Failed to load scans monitor.";
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

  // Real-time: refresh on any scan or attendance event
  useEffect(() => {
    const socket = createTmsSocket(token);
    const handleRefresh = () => fetchAll(selectedDate);
    const handleFailedScan = (payload: FailedScanPayload) => {
      toast.error(formatFailedScanToast(payload));
      handleRefresh();
    };

    socket.on("SUCCESS-SCAN", handleRefresh);
    socket.on("ATTENDANCE-CONFIRMED", handleRefresh);
    socket.on("FAILED-SCAN", handleFailedScan);

    return () => {
      socket.off("SUCCESS-SCAN", handleRefresh);
      socket.off("ATTENDANCE-CONFIRMED", handleRefresh);
      socket.off("FAILED-SCAN", handleFailedScan);
      socket.disconnect();
    };
  }, [selectedDate, fetchAll, token]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) setSelectedDate(date);
  };

  const isEmpty = !hasPtSessions && classes.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────

  const peekTel = peek ? telHref(peek.phone) : undefined;
  const showInitialSpinner = loading && !hasLoaded;

  return (
    <div className="space-y-4">
      <div
        data-walkthrough="coach-scans-header"
        className="flex flex-wrap items-center justify-end gap-2 border-b pb-3"
      >
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
        <CoachScansSkeleton />
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
              <AttendanceContainer
                title="Today's Clients"
                classScans={ptScans}
                emptyMessage="No PT check-ins yet for this date."
                memberHrefBuilder={(memberId) => `/coach/clients/${memberId}`}
                onSelect={setPeek}
                dataWalkthrough="coach-scans-pt"
                rowWalkthrough="coach-scans-row"
              />
            </div>
          )}

          {(hasScheduledClasses || classes.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Scheduled Classes
              </h3>
              {classes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No scheduled classes for this date.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {classes.map((cls) => (
                    <ClassScanCard
                      key={cls.scheduledClassId}
                      data={cls}
                      currentTime={currentTime}
                      onSelect={setPeek}
                      onConfirmAttendance={setConfirmingSession}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmAttendanceDialog
        session={confirmingSession}
        open={!!confirmingSession}
        onOpenChange={(open) => !open && setConfirmingSession(null)}
        onSuccess={() => fetchAll(selectedDate)}
      />

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
                    href={`/coach/clients/${peek.memberId}`}
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
