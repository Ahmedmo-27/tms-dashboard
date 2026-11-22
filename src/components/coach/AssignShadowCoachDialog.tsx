"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, UserX, Clock, MapPin, GraduationCap } from "lucide-react";
import { useCoachApi } from "@/hooks/useCoachApi";
import toast from "react-hot-toast";
import type { ShadowCoachSummaryDto } from "@/types/coach.types";

interface AssignShadowCoachDialogProps {
  open: boolean;
  onClose: () => void;
  scheduledClassId: string;
  classTitle?: string;
  startTime?: string;
  endTime?: string;
  location?: string | null;
  leadCoachName?: string;
  currentShadowCoachId?: string | null;
  currentShadowCoachName?: string | null;
  onAssigned?: () => void;
}

function formatTime12h(time?: string): string {
  if (!time) return "";
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return time;
  const minute = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

export function AssignShadowCoachDialog({
  open,
  onClose,
  scheduledClassId,
  classTitle,
  startTime,
  endTime,
  location,
  leadCoachName,
  currentShadowCoachId,
  currentShadowCoachName,
  onAssigned,
}: AssignShadowCoachDialogProps) {
  const coachApi = useCoachApi();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shadowCoaches, setShadowCoaches] = useState<ShadowCoachSummaryDto[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("none");

  // Load active candidates when dialog opens
  useEffect(() => {
    if (!open) return;

    setSelectedCoachId(currentShadowCoachId || "none");
    setLoading(true);

    const loadCoaches = async () => {
      try {
        let res;
        try {
          res = await coachApi.get("/api/coach/managing/shadow-coaches");
        } catch (err: any) {
          if (err.response?.status === 403 || err.response?.status === 404) {
            res = await coachApi.get("/api/admin/shadow-coaches");
          } else {
            throw err;
          }
        }

        const data = res.data?.data || res.data || [];
        if (Array.isArray(data)) {
          setShadowCoaches(data);
        }
      } catch (err: any) {
        console.error("Failed to load shadow coaches for assignment", err);
        toast.error("Failed to load shadow coaches list");
      } finally {
        setLoading(false);
      }
    };

    loadCoaches();
  }, [open, currentShadowCoachId, coachApi]);

  const handleSave = async () => {
    if (!scheduledClassId) return;

    setSaving(true);
    try {
      const payload = {
        shadowCoachId: selectedCoachId === "none" ? null : selectedCoachId,
      };

      await coachApi.patch(
        `/api/coach/managing/classes/${scheduledClassId}/shadow-coach`,
        payload
      );

      if (selectedCoachId === "none") {
        toast.success("Shadow coach removed from class");
      } else {
        const assigned = shadowCoaches.find((c) => c.coachId === selectedCoachId);
        toast.success(
          assigned
            ? `Assigned ${assigned.coachName} to this class`
            : "Shadow coach assigned successfully"
        );
      }

      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error("Failed to assign shadow coach", err);
      const msg =
        err.response?.data?.message ||
        "Failed to assign shadow coach. Only managing coaches can modify assignments.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedCoachObj = shadowCoaches.find((c) => c.coachId === selectedCoachId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Assign Shadow Coach
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select a shadow coach in training to accompany the lead coach
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Class Overview */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground text-sm">
              {classTitle || "Class Session"}
            </span>
            {leadCoachName && (
              <Badge variant="outline" className="text-[10px]">
                Lead: {leadCoachName}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            {startTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime12h(startTime)} {endTime ? `– ${formatTime12h(endTime)}` : ""}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
          </div>
        </div>

        {/* Selection Area */}
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              Assigned Shadow Coach
            </label>
            {currentShadowCoachName && (
              <span className="text-[11px] text-muted-foreground">
                Currently:{" "}
                <span className="font-medium text-foreground">
                  {currentShadowCoachName}
                </span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading shadow coaches...
            </div>
          ) : (
            <Select
              value={selectedCoachId}
              onValueChange={setSelectedCoachId}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a shadow coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <UserX className="h-3.5 w-3.5" />
                    None (No shadow coach)
                  </span>
                </SelectItem>
                {shadowCoaches.map((coach) => (
                  <SelectItem key={coach.coachId} value={coach.coachId}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="font-medium">{coach.coachName}</span>
                      <span className="text-[11px] text-muted-foreground">
                        Phase {coach.currentPhase || 1}/3 ({coach.progressPercent ?? 0}%)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedCoachObj && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  {selectedCoachObj.coachName}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  Phase {selectedCoachObj.currentPhase || 1}/3
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {selectedCoachObj.phaseLabel || "Observe + support"}
              </p>
              {selectedCoachObj.phoneNumber && (
                <p className="text-[10px] text-muted-foreground">
                  Phone: {selectedCoachObj.phoneNumber}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
