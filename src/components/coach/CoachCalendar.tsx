"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { SessionClientsModal } from "@/components/coach/SessionClientsModal";
import type { RootState } from "@/lib/store/store";
import type { DayDto, SessionDto } from "@/types/coach.types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

function formatTime12h(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

function parseDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatWeekRange(days: DayDto[]): string {
  if (days.length === 0) return "";
  const start = parseDay(days[0].date);
  const end = parseDay(days[days.length - 1].date);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, "d")} – ${format(end, "d MMM yyyy")}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
}

export function CoachCalendar() {
  const coachApi = useCoachApi();
  const dispatch = useAppDispatch();
  const { schedule, scheduleLoading } = useAppSelector(
    (state: RootState) => state.coach
  );

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const [clientsModalSession, setClientsModalSession] = useState<SessionDto | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd")
  );

  useEffect(() => {
    const fetchSchedule = async () => {
      dispatch(setScheduleLoading(true));
      try {
        const mondayISO = format(currentWeekStart, "yyyy-MM-dd");
        const res = await coachApi.get(`/api/coach/schedule?weekStart=${mondayISO}`);
        dispatch(setSchedule(res.data.data));
      } catch (err) {
        console.error("Failed to load schedule", err);
        toast.error("Failed to load schedule.");
      } finally {
        dispatch(setScheduleLoading(false));
      }
    };

    fetchSchedule();
  }, [coachApi, currentWeekStart, dispatch]);

  useEffect(() => {
    if (!schedule?.days?.length) return;
    const dates = schedule.days.map((d) => d.date);
    if (!dates.includes(selectedDate)) {
      const today = format(new Date(), "yyyy-MM-dd");
      setSelectedDate(dates.includes(today) ? today : dates[0]);
    }
  }, [schedule, selectedDate]);

  const handlePrevWeek = () => {
    setClientsModalSession(null);
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setClientsModalSession(null);
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleShowLatestSession = async () => {
    if (!schedule) return;
    const now = new Date();
    let foundSession: SessionDto | null = null;
    let foundDate: string | null = null;
    let checkWeekStart = currentWeekStart;
    let weeksSearched = 0;

    dispatch(setScheduleLoading(true));
    try {
      while (weeksSearched < 4 && !foundSession) {
        const mondayISO = format(checkWeekStart, "yyyy-MM-dd");
        let daysToSearch: DayDto[] = [];

        if (weeksSearched === 0) {
          daysToSearch = schedule.days;
        } else {
          const res = await coachApi.get(`/api/coach/schedule?weekStart=${mondayISO}`);
          daysToSearch = res.data.data.days;
        }

        let latestDiff = Infinity;
        daysToSearch.forEach((day: DayDto) => {
          day.sessions.forEach((session: SessionDto) => {
            const sessionStart = new Date(`${day.date}T${session.startTime}`);
            if (sessionStart <= now) {
              const diff = now.getTime() - sessionStart.getTime();
              if (diff < latestDiff) {
                latestDiff = diff;
                foundSession = session;
                foundDate = day.date;
              }
            }
          });
        });

        if (foundSession) break;

        checkWeekStart = addDays(checkWeekStart, -7);
        weeksSearched++;
      }

      if (foundSession && foundDate) {
        if (weeksSearched > 0) {
          setCurrentWeekStart(checkWeekStart);
        }
        setSelectedDate(foundDate);
        setTimeout(() => setClientsModalSession(foundSession), 50);
      } else {
        toast("No past sessions found in the recent weeks.");
      }
    } catch (err) {
      console.error("Failed to find latest session", err);
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };

  const handleShowNextSession = async () => {
    if (!schedule) return;
    const now = new Date();
    let foundSession: SessionDto | null = null;
    let foundDate: string | null = null;
    let checkWeekStart = currentWeekStart;
    let weeksSearched = 0;

    dispatch(setScheduleLoading(true));
    try {
      while (weeksSearched < 4 && !foundSession) {
        const mondayISO = format(checkWeekStart, "yyyy-MM-dd");
        let daysToSearch: DayDto[] = [];

        if (weeksSearched === 0) {
          daysToSearch = schedule.days;
        } else {
          const res = await coachApi.get(`/api/coach/schedule?weekStart=${mondayISO}`);
          daysToSearch = res.data.data.days;
        }

        let nextDiff = Infinity;
        daysToSearch.forEach((day: DayDto) => {
          day.sessions.forEach((session: SessionDto) => {
            const sessionStart = new Date(`${day.date}T${session.startTime}`);
            if (sessionStart > now) {
              const diff = sessionStart.getTime() - now.getTime();
              if (diff < nextDiff) {
                nextDiff = diff;
                foundSession = session;
                foundDate = day.date;
              }
            }
          });
        });

        if (foundSession) break;

        checkWeekStart = addDays(checkWeekStart, 7);
        weeksSearched++;
      }

      if (foundSession && foundDate) {
        if (weeksSearched > 0) {
          setCurrentWeekStart(checkWeekStart);
        }
        setSelectedDate(foundDate);
        setTimeout(() => setClientsModalSession(foundSession), 50);
      } else {
        toast("No upcoming sessions found in the next few weeks.");
      }
    } catch (err) {
      console.error("Failed to find next session", err);
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };

  const handleToday = () => {
    setClientsModalSession(null);
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const todayIso = format(new Date(), "yyyy-MM-dd");

  const nextSessionId = useMemo(() => {
    if (!schedule) return null;
    const nowMs = Date.now();
    let nextId: string | null = null;
    let nextDiff = Infinity;
    for (const day of schedule.days) {
      for (const session of day.sessions) {
        const sessionStart = new Date(`${day.date}T${session.startTime}`);
        const diff = sessionStart.getTime() - nowMs;
        if (diff > 0 && diff < nextDiff) {
          nextDiff = diff;
          nextId = session.scheduledClassId;
        }
      }
    }
    return nextId;
  }, [schedule]);

  const selectedDay = schedule?.days.find((d) => d.date === selectedDate);
  const weekTitle = schedule ? formatWeekRange(schedule.days) : "Loading…";
  const isCurrentWeek = format(currentWeekStart, "yyyy-MM-dd") ===
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const renderToolbar = () => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
          disabled={scheduleLoading}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[168px] text-center">
          <p className="text-sm font-semibold">{weekTitle}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          disabled={scheduleLoading}
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={isCurrentWeek ? "secondary" : "outline"}
          size="sm"
          onClick={handleToday}
          disabled={scheduleLoading}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShowLatestSession}
          disabled={scheduleLoading}
        >
          Latest
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShowNextSession}
          disabled={scheduleLoading}
        >
          Next session
        </Button>
      </div>
    </div>
  );

  if (!schedule && scheduleLoading) {
    return (
      <div className="space-y-4">
        {renderToolbar()}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="space-y-4">
        {renderToolbar()}
        <p className="py-12 text-center text-muted-foreground">
          No schedule data available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {renderToolbar()}

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {schedule.days.map((day: DayDto) => {
          const isToday = day.date === todayIso;
          const isActive = day.date === selectedDate;
          const count = day.sessions.length;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-center transition-colors sm:px-2 sm:py-2.5",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted/60",
                isToday && !isActive && "border-primary/50"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide sm:text-xs",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {day.dayName.substring(0, 3)}
              </span>
              <span className="text-sm font-semibold sm:text-base">
                {format(parseDay(day.date), "d")}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {count === 0 ? "—" : `${count}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">
            {selectedDay
              ? format(parseDay(selectedDay.date), "EEEE d MMM")
              : "Select a day"}
          </h2>
          {selectedDay && (
            <p className="text-xs text-muted-foreground">
              {selectedDay.sessions.length === 0
                ? "No classes"
                : `${selectedDay.sessions.length} class${
                    selectedDay.sessions.length === 1 ? "" : "es"
                  }`}
            </p>
          )}
        </div>

        {!selectedDay || selectedDay.sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
            <CalendarDays className="mb-3 h-8 w-8 opacity-40" />
            <p className="text-sm">No sessions on this day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDay.sessions.map((session: SessionDto) => {
              const fullyBooked = session.bookedCount === session.capacity;
              const isNext = session.scheduledClassId === nextSessionId;
              return (
                <div
                  key={session.scheduledClassId}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
                    isNext && "border-primary"
                  )}
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold leading-tight">{session.classTitle}</p>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {session.category}
                      </Badge>
                      {isNext && (
                        <Badge className="text-[10px] font-normal">Up next</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime12h(session.startTime)} – {formatTime12h(session.endTime)}
                      </span>
                      {session.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {session.location}
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5",
                          fullyBooked && "font-medium text-amber-600 dark:text-amber-500"
                        )}
                      >
                        <Users className="h-3.5 w-3.5" />
                        {session.bookedCount} / {session.capacity} booked
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setClientsModalSession(session)}
                  >
                    Show clients
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SessionClientsModal
        session={clientsModalSession}
        onClose={() => setClientsModalSession(null)}
      />
    </div>
  );
}
