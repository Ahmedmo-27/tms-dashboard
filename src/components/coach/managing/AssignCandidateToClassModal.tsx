"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  User,
  UserCheck,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useCoachApi } from "@/hooks/useCoachApi";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { ShadowCoachSummaryDto } from "@/types/coach.types";

interface AssignCandidateToClassModalProps {
  open: boolean;
  onClose: () => void;
  candidate: ShadowCoachSummaryDto | null;
  onSuccess?: () => void;
}

interface ScheduledClassRow {
  _id: string;
  cid?: { name: string; title?: string };
  startTime: string;
  endTime: string;
  locationId?: { name: string; address?: string };
  coachId?: Array<{ coachName: string; _id: string }>;
  coachName?: string;
  shadowCoachId?: { _id: string; coachName: string } | string | null;
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
    return format(date, "EEE, MMM d");
  } catch {
    return "";
  }
}

export function AssignCandidateToClassModal({
  open,
  onClose,
  candidate,
  onSuccess,
}: AssignCandidateToClassModalProps) {
  const coachApi = useCoachApi();
  const [classes, setClasses] = useState<ScheduledClassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSearch("");

    const fetchClasses = async () => {
      try {
        const res = await coachApi.get("/api/coach/managing/classes/upcoming");
        const list = res.data?.data || res.data || [];
        setClasses(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error("Failed to load upcoming classes", err);
        toast.error("Could not load upcoming classes");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [open, coachApi]);

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return classes;
    const q = search.toLowerCase();
    return classes.filter((c) => {
      const title = (c.cid?.name || c.cid?.title || "").toLowerCase();
      const loc = (c.locationId?.name || "").toLowerCase();
      const coaches = (
        c.coachName ||
        c.coachId?.map((co) => co.coachName).join(", ") ||
        ""
      ).toLowerCase();
      const scObj = c.shadowCoachId && typeof c.shadowCoachId === "object" ? c.shadowCoachId : null;
      const shadow = (
        c.shadowCoachName ||
        scObj?.coachName ||
        ""
      ).toLowerCase();
      return (
        title.includes(q) ||
        loc.includes(q) ||
        coaches.includes(q) ||
        shadow.includes(q)
      );
    });
  }, [classes, search]);

  const handleAssign = async (classId: string) => {
    if (!candidate?.coachId) return;
    setAssigningId(classId);

    try {
      await coachApi.patch(`/api/coach/managing/classes/${classId}/shadow-coach`, {
        shadowCoachId: candidate.coachId,
      });

      toast.success(`Assigned ${candidate.coachName} to class`);

      // Update local state to reflect assignment
      setClasses((prev) =>
        prev.map((c) =>
          c._id === classId
            ? {
                ...c,
                shadowCoachId: { _id: candidate.coachId, coachName: candidate.coachName },
                shadowCoachName: candidate.coachName,
              }
            : c
        )
      );

      onSuccess?.();
    } catch (err: any) {
      console.error("Assignment failed", err);
      toast.error(
        err.response?.data?.message || "Failed to assign shadow coach to class"
      );
    } finally {
      setAssigningId(null);
    }
  };

  const handleUnassign = async (classId: string) => {
    setAssigningId(classId);
    try {
      await coachApi.patch(`/api/coach/managing/classes/${classId}/shadow-coach`, {
        shadowCoachId: null,
      });

      toast.success("Shadow coach removed from class");

      setClasses((prev) =>
        prev.map((c) =>
          c._id === classId
            ? {
                ...c,
                shadowCoachId: null,
                shadowCoachName: "",
              }
            : c
        )
      );

      onSuccess?.();
    } catch (err: any) {
      console.error("Unassign failed", err);
      toast.error(err.response?.data?.message || "Failed to remove shadow coach");
    } finally {
      setAssigningId(null);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Assign Candidate to Class
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select an upcoming class for{" "}
                <span className="font-semibold text-foreground">
                  {candidate.coachName}
                </span>{" "}
                (Phase {candidate.currentPhase || 1}/3)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative my-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search upcoming classes by title, coach, or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        {/* Classes List */}
        <ScrollArea className="flex-1 pr-3 max-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading upcoming classes...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground text-xs">
              <Calendar className="h-8 w-8 opacity-30 mb-2" />
              <p className="font-medium">No upcoming classes found</p>
              <p className="text-[11px] text-muted-foreground/80">
                {search ? "Try a different search query" : "No classes scheduled starting today"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredClasses.map((cls) => {
                const title = cls.cid?.name || cls.cid?.title || "Class Session";
                const dateStr = formatDateDisplay(cls.startTime);
                const timeStr = `${formatTime12h(cls.startTime)} – ${formatTime12h(cls.endTime)}`;
                const location = cls.locationId?.name || "";
                const leadCoach =
                  cls.coachName ||
                  cls.coachId?.map((c) => c.coachName).join(", ") ||
                  "Lead Coach";

                const currentScObj =
                  cls.shadowCoachId && typeof cls.shadowCoachId === "object"
                    ? cls.shadowCoachId
                    : null;
                const currentScId = currentScObj
                  ? currentScObj._id
                  : (cls.shadowCoachId as string | undefined);
                const currentScName =
                  cls.shadowCoachName || currentScObj?.coachName || "";

                const isAlreadyThisCandidate = currentScId === candidate.coachId;
                const isBusy = assigningId === cls._id;

                return (
                  <div
                    key={cls._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-border"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {dateStr}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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

                      {/* Current Shadow Status */}
                      {currentScName ? (
                        <div className="flex items-center gap-1 text-[11px] pt-0.5">
                          {isAlreadyThisCandidate ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Assigned to this candidate
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-500 inline-flex items-center gap-1">
                              <UserCheck className="h-3 w-3" /> Shadow: {currentScName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground pt-0.5">
                          No shadow coach assigned
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isAlreadyThisCandidate ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => handleUnassign(cls._id)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={currentScName ? "secondary" : "default"}
                          className="h-8 text-xs"
                          onClick={() => handleAssign(cls._id)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          {currentScName ? "Replace Shadow" : "Assign to Class"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="pt-3 border-t mt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
