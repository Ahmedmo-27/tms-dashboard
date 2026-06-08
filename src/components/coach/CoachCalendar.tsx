"use client";

import { useEffect, useState } from "react";
import { useCoachApi } from "@/hooks/useCoachApi";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  setSchedule,
  setScheduleLoading,
} from "@/lib/store/features/coachSlice";
import { startOfWeek, addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { DeductionModal } from "@/components/coach/DeductionModal";
import type { RootState } from "@/lib/store/store";
import type { MemberPackageData } from "@/components/coach/PackageDetail";
import type { DayDto, SessionDto, CalendarClientDto } from "@/types/coach.types";
import { cn } from "@/lib/utils";

export function CoachCalendar() {
  const coachApi = useCoachApi();
  const dispatch = useAppDispatch();
  const { schedule, scheduleLoading } = useAppSelector(
    (state: RootState) => state.coach
  );

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Expanded sessions tracker
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Mobile active day
  const [mobileActiveDate, setMobileActiveDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd")
  );

  // Deduction modal state
  const [deductTarget, setDeductTarget] = useState<{
    memberId: string;
    memberPackageStartDate: string;
    pkgId: string;
  } | null>(null);

  // Fetch data whenever currentWeekStart changes
  useEffect(() => {
    const fetchSchedule = async () => {
      dispatch(setScheduleLoading(true));
      try {
        const mondayISO = format(currentWeekStart, "yyyy-MM-dd");
        const res = await coachApi.get(`/api/coach/schedule?weekStart=${mondayISO}`);
        dispatch(setSchedule(res.data.data));
        
        // Reset expanded sessions on new week
        setExpandedSessions(new Set());
      } catch (err) {
        console.error("Failed to load schedule", err);
      } finally {
        dispatch(setScheduleLoading(false));
      }
    };

    fetchSchedule();
  }, [coachApi, currentWeekStart, dispatch]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const handlePrevWeek = () => setCurrentWeekStart((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart((prev) => addDays(prev, 7));

  const handlePackageUpdated = (updated: MemberPackageData) => {
    if (!schedule || !deductTarget) return;

    // We clone the schedule to mutate the specific client's activePackage
    const nextSchedule = JSON.parse(JSON.stringify(schedule)) as typeof schedule;

    // Find and update the exact client
    let updatedFlag = false;
    for (const day of nextSchedule.days) {
      for (const session of day.sessions) {
        for (const client of session.clients) {
          if (
            client.memberId === deductTarget.memberId &&
            client.activePackage?.pkgId === deductTarget.pkgId &&
            client.activePackage?.pkgStartDate === deductTarget.memberPackageStartDate
          ) {
            // Found the client to update
            client.activePackage = {
              pkgId: updated.pkgId,
              pkgStartDate: updated.pkgStartDate,
              remainingClasses: updated.remainingClasses,
            };
            updatedFlag = true;
          }
        }
      }
    }

    if (updatedFlag) {
      dispatch(setSchedule(nextSchedule));
    }
  };

  const renderHeader = () => {
    let title = "Loading...";
    if (schedule && !scheduleLoading) {
      const start = new Date(schedule.weekStart);
      const end = new Date(schedule.weekEnd);
      title = `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
    }

    return (
      <div className="flex items-center justify-between py-4">
        <Button variant="outline" size="sm" onClick={handlePrevWeek} disabled={scheduleLoading}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <h2 className="font-semibold text-sm md:text-base">{title}</h2>
        <Button variant="outline" size="sm" onClick={handleNextWeek} disabled={scheduleLoading}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };

  if (!schedule && scheduleLoading) {
    return (
      <div className="space-y-4">
        {renderHeader()}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="space-y-4">
        {renderHeader()}
        <p className="text-center text-muted-foreground py-12">No schedule data available.</p>
      </div>
    );
  }

  const todayIso = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-col h-full space-y-2">
      {renderHeader()}

      {/* Mobile Day Selector Tabs */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b">
        {schedule.days.map((day: DayDto) => {
          const isToday = day.date === todayIso;
          const isActive = day.date === mobileActiveDate;
          return (
            <button
              key={day.date}
              onClick={() => setMobileActiveDate(day.date)}
              className={cn(
                "flex flex-col items-center min-w-[64px] py-2 px-3 rounded-t-lg transition-colors text-sm border-b-2",
                isActive
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
                isToday && !isActive && "text-blue-500"
              )}
            >
              <span className="text-xs uppercase">{day.dayName.substring(0, 3)}</span>
              <span>{format(new Date(day.date), "d")}</span>
            </button>
          );
        })}
      </div>

      {/* Grid wrapper */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-full pb-8">
          {schedule.days.map((day: DayDto) => {
            const isToday = day.date === todayIso;
            
            // On mobile, hide days that aren't the active tab
            const mobileHidden = day.date !== mobileActiveDate ? "hidden md:flex" : "flex";

            return (
              <div
                key={day.date}
                className={cn(
                  "flex-col gap-3 rounded-xl p-3 border h-max min-h-[200px]",
                  mobileHidden,
                  isToday ? "bg-secondary/20 border-primary/20" : "bg-card"
                )}
              >
                <div className="hidden md:flex flex-col text-center pb-2 border-b">
                  <span className={cn("text-xs font-medium uppercase", isToday ? "text-primary" : "text-muted-foreground")}>
                    {day.dayName.substring(0, 3)}
                  </span>
                  <span className={cn("text-sm font-semibold", isToday && "text-primary")}>
                    {format(new Date(day.date), "d MMM")}
                  </span>
                </div>

                {day.sessions.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center min-h-[100px]">
                    <p className="text-xs text-muted-foreground">No sessions</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mt-2 md:mt-0">
                    {day.sessions.map((session: SessionDto) => {
                      const fullyBooked = session.bookedCount === session.capacity;
                      const expanded = expandedSessions.has(session.scheduledClassId);

                      return (
                        <div
                          key={session.scheduledClassId}
                          className="border rounded-lg p-3 flex flex-col gap-2 bg-background shadow-sm"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-bold text-sm leading-tight">{session.classTitle}</p>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {session.category}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {session.startTime} – {session.endTime}
                          </div>
                          <div
                            className={cn(
                              "text-xs font-medium",
                              fullyBooked ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"
                            )}
                          >
                            {session.bookedCount} / {session.capacity} booked
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-7 text-xs w-full justify-between px-2"
                            onClick={() => toggleSession(session.scheduledClassId)}
                          >
                            {expanded ? "Hide clients" : "Show clients"}
                            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>

                          {expanded && (
                            <div className="flex flex-col gap-2 mt-2 pt-2 border-t">
                              {session.clients.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">No bookings yet</p>
                              ) : (
                                session.clients.map((client: CalendarClientDto) => {
                                  const pkg = client.activePackage;
                                  return (
                                    <div key={client.memberId} className="flex flex-col gap-1 p-2 bg-muted/30 rounded-md border text-xs">
                                      <div className="flex justify-between items-start">
                                        <p className="font-bold">{client.name}</p>
                                        <span className="text-[10px] text-muted-foreground max-w-[80px] truncate" title={client.bookingMethod}>
                                          {client.bookingMethod}
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground">{client.phoneNumber}</p>
                                      
                                      <div className="flex justify-between items-center mt-1">
                                        {pkg ? (
                                          <span className="text-muted-foreground">
                                            {pkg.remainingClasses} classes remaining
                                          </span>
                                        ) : (
                                          <span className="text-destructive font-medium">
                                            No active package
                                          </span>
                                        )}
                                        <Button
                                          size="sm"
                                          className="h-6 text-[10px] px-2"
                                          disabled={!pkg}
                                          title={!pkg ? "No active package" : undefined}
                                          onClick={() => {
                                            if (pkg) {
                                              setDeductTarget({
                                                memberId: client.memberId,
                                                memberPackageStartDate: pkg.pkgStartDate,
                                                pkgId: pkg.pkgId,
                                              });
                                            }
                                          }}
                                        >
                                          Deduct
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deduction Modal */}
      {deductTarget && (
        <DeductionModal
          open
          memberId={deductTarget.memberId}
          memberPackageStartDate={deductTarget.memberPackageStartDate}
          pkgId={deductTarget.pkgId}
          onClose={() => setDeductTarget(null)}
          onSuccess={handlePackageUpdated}
        />
      )}
    </div>
  );
}
