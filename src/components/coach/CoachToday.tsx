"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCoachApi } from "@/hooks/useCoachApi";
import { getCoachToday } from "@/lib/data/coach-portal";
import type { TodaySummaryDto, SessionDto } from "@/types/coach.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Loader2,
  ScanLine,
  Ticket,
  Users,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setSchedule } from "@/lib/store/features/coachSlice";
import { SessionClientsModal } from "@/components/coach/SessionClientsModal";
import { CoachTodaySkeleton } from "@/components/ui/loading/coach-skeletons";
import { startOfWeek, format } from "date-fns";

function formatTime12h(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

export function CoachToday() {
  const coachApi = useCoachApi();
  const dispatch = useAppDispatch();
  const hasPtSessions = useAppSelector((s) => s.coach.hasPtSessions);
  const hasScheduledClasses = useAppSelector((s) => s.coach.hasScheduledClasses);
  const schedule = useAppSelector((s) => s.coach.schedule);

  const [data, setData] = useState<TodaySummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedSession, setSelectedSession] = useState<SessionDto | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

  const handleOpenRoster = async (
    scheduledClassId: string,
    classTitle: string,
    category: string,
    startTime: string,
    endTime: string,
    capacity: number,
    bookedCount: number
  ) => {
    // 1. Check if session exists in memory schedule
    if (schedule?.days) {
      for (const day of schedule.days) {
        const found = day.sessions.find((s: SessionDto) => s.scheduledClassId === scheduledClassId);
        if (found) {
          setSelectedSession(found);
          return;
        }
      }
    }

    // 2. Otherwise load current week schedule
    setLoadingSessionId(scheduledClassId);
    try {
      const mondayISO = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const res = await coachApi.get(`/api/coach/schedule?weekStart=${mondayISO}`);
      const schedData = res.data.data;
      if (schedData) {
        dispatch(setSchedule(schedData));
        for (const day of schedData.days ?? []) {
          const found = day.sessions.find((s: any) => s.scheduledClassId === scheduledClassId);
          if (found) {
            setSelectedSession(found);
            return;
          }
        }
      }
      setSelectedSession({
        scheduledClassId,
        classTitle,
        category,
        startTime,
        endTime,
        capacity,
        bookedCount,
        location: null,
        clients: [],
      });
    } catch {
      setSelectedSession({
        scheduledClassId,
        classTitle,
        category,
        startTime,
        endTime,
        capacity,
        bookedCount,
        location: null,
        clients: [],
      });
    } finally {
      setLoadingSessionId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        setData(await getCoachToday(coachApi));
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.context?.message || err?.message || "Could not load today’s summary.";
        setError(msg.includes("status code") ? "Could not load today's summary. Please try again." : msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coachApi, reloadKey]);

  if (loading) {
    return <CoachTodaySkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <p className="text-sm">{error ?? "Nothing to show yet."}</p>
        <Button variant="outline" size="sm" onClick={() => setReloadKey(k => k + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  const next = data.nextSession;
  const scanTotal =
    data.scans.successCount + data.scans.failedCount + data.scans.willPayCount;

  return (
    <div className="space-y-4">
      <Card data-walkthrough="coach-today-next">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Next session</CardTitle>
        </CardHeader>
        <CardContent>
          {next ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{next.classTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {next.date} · {formatTime12h(next.startTime)} –{" "}
                  {formatTime12h(next.endTime)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {next.bookedCount} / {next.capacity} booked
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <Link href="/coach/schedule">Open schedule</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming sessions this week.
              {hasScheduledClasses
                ? " Check the schedule for later weeks."
                : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {hasScheduledClasses && (
        <Card data-walkthrough="coach-today-classes">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Today’s classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.todaySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No classes on the board today.
              </p>
            ) : (
              data.todaySessions.map((s) => (
                <div
                  key={s.scheduledClassId}
                  onClick={() =>
                    handleOpenRoster(
                      s.scheduledClassId,
                      s.classTitle,
                      s.category,
                      s.startTime,
                      s.endTime,
                      s.capacity,
                      s.bookedCount
                    )
                  }
                  className="group flex items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-muted/60 cursor-pointer"
                  title="Click to view enrolled clients roster"
                >
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5 group-hover:text-primary transition-colors">
                      {s.classTitle}
                      {loadingSessionId === s.scheduledClassId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {formatTime12h(s.startTime)} – {formatTime12h(s.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {s.bookedCount}/{s.capacity}
                    </span>
                    <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {(hasScheduledClasses || hasPtSessions) && (
          <Card data-walkthrough="coach-today-scans">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScanLine className="h-4 w-4" />
                Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanTotal === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No check-ins yet today.
                </p>
              ) : (
                <div className="space-y-1 text-sm">
                  <p>{data.scans.successCount} checked in</p>
                  {data.scans.failedCount > 0 && (
                    <p className="text-destructive">
                      {data.scans.failedCount} failed
                    </p>
                  )}
                  {data.scans.willPayCount > 0 && (
                    <p>{data.scans.willPayCount} will pay</p>
                  )}
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/coach/scans">Open scans</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card data-walkthrough="coach-today-tickets">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="h-4 w-4" />
              Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {data.tickets.openCount === 0
                ? "No open requests."
                : `${data.tickets.openCount} open request${
                    data.tickets.openCount === 1 ? "" : "s"
                  }.`}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/coach/tickets">View tickets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {hasPtSessions && (
        <Card data-walkthrough="coach-today-pt-alerts">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              PT attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.ptAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No packages expiring soon or low on remaining classes.
              </p>
            ) : (
              <div className="space-y-2">
                {data.ptAlerts.map((alert) => (
                  <Link
                    key={`${alert.memberId}-${alert.packageName}`}
                    href={`/coach/clients/${alert.memberId}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.packageName} · {alert.remainingClasses} left ·{" "}
                        {alert.daysUntilExpiry}d
                      </p>
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSession && (
        <SessionClientsModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
