"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Clock,
  Loader2,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";
import { useCoachApi } from "@/hooks/useCoachApi";
import toast from "react-hot-toast";

export interface AttendanceConfirmationData {
  confirmed: boolean;
  confirmedCount: number;
  hasMissingPlace: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  notes?: string;
}

export interface CoachSessionForConfirmation {
  scheduledClassId: string;
  classTitle: string;
  category: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  location: string | null;
  scans: { status: string }[];
  attendanceConfirmation?: AttendanceConfirmationData | null;
}

interface ConfirmAttendanceDialogProps {
  session: CoachSessionForConfirmation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConfirmAttendanceDialog({
  session,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmAttendanceDialogProps) {
  const coachApi = useCoachApi();
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState<number>(0);
  const [hasMissingPlace, setHasMissingPlace] = useState(false);
  const [userToggledMissingPlace, setUserToggledMissingPlace] = useState(false);
  const [notes, setNotes] = useState("");

  const successCount =
    session?.scans?.filter((s) => s.status === "SUCCESS").length ?? 0;

  useEffect(() => {
    if (!session || !open) return;

    if (session.attendanceConfirmation?.confirmed) {
      setCount(session.attendanceConfirmation.confirmedCount);
      setHasMissingPlace(session.attendanceConfirmation.hasMissingPlace);
      setUserToggledMissingPlace(true);
      setNotes(session.attendanceConfirmation.notes ?? "");
    } else {
      // Default to checked-in count, or 0
      const initialCount = successCount;
      setCount(initialCount);
      setHasMissingPlace(initialCount < session.bookedCount);
      setUserToggledMissingPlace(false);
      setNotes("");
    }
  }, [session, open, successCount]);

  const handleCountChange = (newCount: number) => {
    const val = Math.max(0, newCount);
    setCount(val);
    if (!userToggledMissingPlace && session) {
      setHasMissingPlace(val < session.bookedCount);
    }
  };

  const handleMissingPlaceToggle = (checked: boolean) => {
    setUserToggledMissingPlace(true);
    setHasMissingPlace(checked);
  };

  const handleConfirm = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      await coachApi.post(
        `/api/coach/scans/${session.scheduledClassId}/confirm-attendance`,
        {
          confirmedCount: count,
          hasMissingPlace,
          notes: notes.trim(),
        }
      );
      toast.success("Attendance confirmed successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.context?.message ||
        "Failed to confirm attendance.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">Confirm Class Attendance</DialogTitle>
            <Badge variant="outline" className="text-xs font-normal">
              {session.category}
            </Badge>
          </div>
          <DialogDescription>
            {session.classTitle} · {session.startTime} – {session.endTime}
            {session.location ? ` · ${session.location}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <span className="text-xs text-muted-foreground">Booked</span>
              <p className="text-base font-semibold">{session.bookedCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <span className="text-xs text-muted-foreground">Checked In</span>
              <p className="text-base font-semibold">{successCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <span className="text-xs text-muted-foreground">Capacity</span>
              <p className="text-base font-semibold">{session.capacity}</p>
            </div>
          </div>

          {/* Headcount Stepper */}
          <div className="space-y-2 rounded-lg border p-4 bg-card">
            <label className="text-sm font-medium">
              Physical Attendance Count
            </label>
            <p className="text-xs text-muted-foreground">
              Confirm the number of attendees physically present in the session.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => handleCountChange(count - 1)}
                disabled={count <= 0 || submitting}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={0}
                value={count}
                onChange={(e) => handleCountChange(parseInt(e.target.value, 10) || 0)}
                className="h-12 w-24 text-center text-xl font-bold"
                disabled={submitting}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => handleCountChange(count + 1)}
                disabled={submitting}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Missing Place Alert & Checkbox */}
          <div className="space-y-3 rounded-lg border p-3.5">
            {count < session.bookedCount ? (
              <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded border border-amber-200 dark:border-amber-900/50">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold">Missing Place Detected:</span>{" "}
                  {session.bookedCount - count} booked member(s) are unaccounted for.
                </div>
              </div>
            ) : count > session.bookedCount ? (
              <div className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded border border-blue-200 dark:border-blue-900/50">
                <Users className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  More attendees present ({count}) than booked bookings ({session.bookedCount}).
                </div>
              </div>
            ) : null}

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="missing-place"
                checked={hasMissingPlace}
                onCheckedChange={(checked) =>
                  handleMissingPlaceToggle(Boolean(checked))
                }
                disabled={submitting}
              />
              <label
                htmlFor="missing-place"
                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Flag as Missing Place / Discrepancy
              </label>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Notifies branch administration and management that attendance has an empty spot or absent member.
            </p>
          </div>

          {/* Notes input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Notes (Optional)
            </label>
            <Input
              placeholder="e.g., John absent, walk-in attended without booking..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Attendance
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
