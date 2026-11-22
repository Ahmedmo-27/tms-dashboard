"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useCoachApi } from "@/hooks/useCoachApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  UserCheck,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { AssignShadowCoachDialog } from "@/components/coach/AssignShadowCoachDialog";
import { ShadowCoachChecklistModal } from "@/components/coach/ShadowCoachChecklistModal";
import { PaymentDatePicker } from "@/components/ui/payments/date-picker";
import { cn } from "@/lib/utils";

interface ScheduledClassItem {
  _id: string;
  cid?: { name: string; title?: string; category?: string };
  startTime: string;
  endTime: string;
  locationId?: { name: string; address?: string };
  coachId?: Array<{ coachName: string; _id: string }>;
  coachName?: string;
  shadowCoachId?: { _id: string; coachName: string; currentPhase?: number } | string | null;
  shadowCoachName?: string;
}

function formatTime12h(isoString: string): string {
  try {
    const date = new Date(isoString);
    return format(date, "h:mm a");
  } catch {
    return "";
  }
}

function formatDateDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    return format(date, "EEEE, MMMM d");
  } catch {
    return "";
  }
}

export function ClassAssignmentsView() {
  const coachApi = useCoachApi();
  const [classes, setClasses] = useState<ScheduledClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unassigned" | "assigned">("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date());

  // Selected session for assignment modal
  const [assignClass, setAssignClass] = useState<ScheduledClassItem | null>(null);
  // Selected session for checklist modal
  const [checklistClass, setChecklistClass] = useState<ScheduledClassItem | null>(null);

  const fetchUpcoming = useCallback(
    async (isRefresh = false, dateOverride?: Date | null) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const effectiveDate =
          dateOverride === null
            ? undefined
            : dateOverride !== undefined
            ? dateOverride
            : selectedDate;

        let url = "/api/coach/managing/classes/upcoming";
        if (effectiveDate) {
          url += `?date=${format(effectiveDate, "yyyy-MM-dd")}`;
        }

        const res = await coachApi.get(url);
        const list = res.data?.data || res.data || [];
        setClasses(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error("Failed to load upcoming classes", err);
        toast.error("Failed to load classes for assignment");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [coachApi, selectedDate]
  );

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    fetchUpcoming(false, date || null);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    fetchUpcoming(false, today);
  };

  const handleClearDate = () => {
    setSelectedDate(undefined);
    fetchUpcoming(false, null);
  };

  const counts = useMemo(() => {
    let unassigned = 0;
    let assigned = 0;
    let total = 0;
    classes.forEach((c) => {
      if (selectedDate) {
        try {
          const classDateStr = format(new Date(c.startTime), "yyyy-MM-dd");
          const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
          if (classDateStr !== selectedDateStr) return;
        } catch {
          // ignore parsing error
        }
      }
      total++;
      const hasSc = Boolean(
        c.shadowCoachName ||
        (typeof c.shadowCoachId === "object" && c.shadowCoachId?._id) ||
        (typeof c.shadowCoachId === "string" && c.shadowCoachId)
      );
      if (hasSc) assigned++;
      else unassigned++;
    });
    return { all: total, unassigned, assigned };
  }, [classes, selectedDate]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      // Date filter: only show classes belonging to the picked date
      if (selectedDate) {
        try {
          const classDateStr = format(new Date(c.startTime), "yyyy-MM-dd");
          const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
          if (classDateStr !== selectedDateStr) return false;
        } catch {
          // ignore parsing error
        }
      }

      const hasSc = Boolean(
        c.shadowCoachName ||
        (typeof c.shadowCoachId === "object" && c.shadowCoachId?._id) ||
        (typeof c.shadowCoachId === "string" && c.shadowCoachId)
      );

      if (filter === "unassigned" && hasSc) return false;
      if (filter === "assigned" && !hasSc) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();

      const title = (c.cid?.name || c.cid?.title || "").toLowerCase();
      const loc = (c.locationId?.name || "").toLowerCase();
      const coaches = (
        c.coachName ||
        c.coachId?.map((co) => co.coachName).join(", ") ||
        ""
      ).toLowerCase();
      const scName = (
        c.shadowCoachName ||
        (typeof c.shadowCoachId === "object" ? c.shadowCoachId?.coachName : "") ||
        ""
      ).toLowerCase();

      return (
        title.includes(q) ||
        loc.includes(q) ||
        coaches.includes(q) ||
        scName.includes(q)
      );
    });
  }, [classes, filter, search, selectedDate]);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            className="h-8 text-xs rounded-full px-3"
            onClick={() => setFilter("all")}
          >
            All Classes ({counts.all})
          </Button>
          <Button
            size="sm"
            variant={filter === "unassigned" ? "default" : "outline"}
            className={cn(
              "h-8 text-xs rounded-full px-3",
              filter !== "unassigned" && counts.unassigned > 0 && "text-amber-600 dark:text-amber-500 border-amber-300"
            )}
            onClick={() => setFilter("unassigned")}
          >
            Needs Shadow Coach ({counts.unassigned})
          </Button>
          <Button
            size="sm"
            variant={filter === "assigned" ? "default" : "outline"}
            className="h-8 text-xs rounded-full px-3"
            onClick={() => setFilter("assigned")}
          >
            Shadow Assigned ({counts.assigned})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search classes, coaches, branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => fetchUpcoming(true)}
            disabled={refreshing || loading}
            title="Refresh classes"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-muted/20 border rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">Date:</span>
          {selectedDate ? (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-medium">
              {format(selectedDate, "EEE, MMM d, yyyy")}
              {format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? " (Today)" : ""}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs font-normal">
              All Upcoming Classes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={
              selectedDate &&
              format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                ? "default"
                : "outline"
            }
            size="sm"
            className="h-8 text-xs px-2.5"
            onClick={handleToday}
          >
            Today
          </Button>

          <PaymentDatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            placeholder="Pick a date"
            className="h-8 text-xs min-h-[32px] px-2.5"
          />

          {selectedDate ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground px-2.5"
              onClick={handleClearDate}
              title="Show all upcoming classes regardless of date"
            >
              Show All Classes
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={handleToday}
            >
              Back to Today
            </Button>
          )}
        </div>
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Loading class schedule...
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground text-xs">
            <Calendar className="h-10 w-10 opacity-30 mb-2" />
            <p className="font-semibold text-foreground text-sm">No classes found</p>
            <p className="text-muted-foreground max-w-sm mt-1">
              {search
                ? "No scheduled classes match your search query."
                : selectedDate
                ? `No scheduled classes found on ${format(selectedDate, "EEEE, MMMM d, yyyy")}.`
                : filter === "unassigned"
                ? "Great job! All upcoming classes currently have a shadow coach assigned."
                : "No upcoming classes found on the schedule."}
            </p>
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={handleClearDate}
              >
                Show All Upcoming Classes
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredClasses.map((cls) => {
            const title = cls.cid?.name || cls.cid?.title || "Class Session";
            const dateStr = formatDateDisplay(cls.startTime);
            const timeStr = `${formatTime12h(cls.startTime)} – ${formatTime12h(cls.endTime)}`;
            const location = cls.locationId?.name || "Main Branch";
            const leadCoach =
              cls.coachName ||
              cls.coachId?.map((c) => c.coachName).join(", ") ||
              "Lead Coach";

            const scObj =
              cls.shadowCoachId && typeof cls.shadowCoachId === "object"
                ? cls.shadowCoachId
                : null;
            const scId = scObj ? scObj._id : (cls.shadowCoachId as string | undefined);
            const scName = cls.shadowCoachName || scObj?.coachName || "";
            const hasShadow = Boolean(scName || scId);

            return (
              <Card
                key={cls._id}
                className={cn(
                  "transition-all duration-200 border",
                  hasShadow ? "bg-card" : "bg-card/70 border-amber-200/60 dark:border-amber-900/30"
                )}
              >
                <CardHeader className="p-3.5 pb-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {title}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {dateStr}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeStr}
                        </span>
                        {location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Lead: {leadCoach}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 pt-0">
                  <div className="flex items-center justify-between gap-2 pt-2 border-t mt-1">
                    {hasShadow ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserCheck className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {scName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Shadow Trainee {scObj?.currentPhase ? `(Phase ${scObj.currentPhase}/3)` : ""}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 font-medium">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>No shadow coach assigned</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasShadow && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          onClick={() => setChecklistClass(cls)}
                        >
                          Checklist
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={hasShadow ? "outline" : "default"}
                        className={cn(
                          "h-7 text-xs px-2.5 gap-1",
                          !hasShadow && "bg-primary text-primary-foreground font-medium"
                        )}
                        onClick={() => setAssignClass(cls)}
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        {hasShadow ? "Change" : "Assign Shadow"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Shadow Coach Dialog */}
      {assignClass && (
        <AssignShadowCoachDialog
          open={Boolean(assignClass)}
          onClose={() => setAssignClass(null)}
          scheduledClassId={assignClass._id}
          classTitle={assignClass.cid?.name || assignClass.cid?.title || "Class Session"}
          startTime={formatTime12h(assignClass.startTime)}
          endTime={formatTime12h(assignClass.endTime)}
          location={assignClass.locationId?.name}
          leadCoachName={
            assignClass.coachName ||
            assignClass.coachId?.map((c) => c.coachName).join(", ")
          }
          currentShadowCoachId={
            typeof assignClass.shadowCoachId === "object"
              ? assignClass.shadowCoachId?._id
              : (assignClass.shadowCoachId as string | undefined)
          }
          currentShadowCoachName={
            assignClass.shadowCoachName ||
            (typeof assignClass.shadowCoachId === "object"
              ? assignClass.shadowCoachId?.coachName
              : "")
          }
          onAssigned={() => fetchUpcoming(true)}
        />
      )}

      {/* Shadow Coach Checklist Targets Modal */}
      {checklistClass && (
        <ShadowCoachChecklistModal
          open={Boolean(checklistClass)}
          onClose={() => setChecklistClass(null)}
          scheduledClassId={checklistClass._id}
          classTitle={checklistClass.cid?.name || checklistClass.cid?.title}
          shadowCoachName={
            checklistClass.shadowCoachName ||
            (typeof checklistClass.shadowCoachId === "object"
              ? checklistClass.shadowCoachId?.coachName
              : "")
          }
        />
      )}
    </div>
  );
}
