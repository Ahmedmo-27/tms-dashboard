"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FreezeRequestItem } from "@/lib/data/freeze";
import { approveFreezeAction } from "@/lib/actions/freeze-actions";
import { Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getActionErrorMessage } from "@/lib/utils/api-error-message";

export function ApproveFreezeDialog({
  request,
  onSuccess,
}: {
  request: FreezeRequestItem;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [durationDays, setDurationDays] = useState<number>(
    request.requestedDurationDays
  );
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks">("days");
  const [adminNote, setAdminNote] = useState("");

  const memberName = request.memberId?.name ?? "Member";
  const requestedWeeks = (request.requestedDurationDays / 7).toFixed(1).replace(/\.0$/, "");

  const handleApprove = async () => {
    try {
      setLoading(true);
      const days = durationUnit === "weeks" ? durationDays * 7 : durationDays;
      if (days < 1) {
        toast.error("Please enter a valid freeze duration (at least 1 day)");
        return;
      }

      const res = await approveFreezeAction(
        request._id,
        days,
        adminNote.trim() || undefined
      );

      if (res.success) {
        toast.success(`Freeze request approved for ${days} day(s)!`);
        setOpen(false);
        onSuccess?.();
      } else {
        const errorMsg = getActionErrorMessage(res, "Failed to approve freeze request");
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
          <Check className="h-4 w-4" />
          Approve
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Approve Extra Freeze Request</DialogTitle>
          <DialogDescription>
            Review and approve freeze duration for <strong>{memberName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/60 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package:</span>
              <span className="font-medium">{request.pkgName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested Duration:</span>
              <span className="font-semibold text-primary">
                {request.requestedDurationDays} Days (~{requestedWeeks} Weeks)
              </span>
            </div>
            <div className="pt-1">
              <span className="text-muted-foreground block mb-1">Member's Reason:</span>
              <p className="italic bg-background/80 p-2 rounded border text-xs">
                "{request.reason}"
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Approved Freeze Duration</Label>
            <div className="flex items-center gap-2">
              <Input
                id="duration"
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="flex-1"
              />
              <select
                value={durationUnit}
                onChange={(e) => {
                  const newUnit = e.target.value as "days" | "weeks";
                  if (newUnit === "weeks" && durationUnit === "days") {
                    setDurationDays(Math.max(1, Math.round(durationDays / 7)));
                  } else if (newUnit === "days" && durationUnit === "weeks") {
                    setDurationDays(durationDays * 7);
                  }
                  setDurationUnit(newUnit);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              You can accept the requested duration or adjust to a shorter/custom period.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNote">Admin Note / Feedback (Optional)</Label>
            <Textarea
              id="adminNote"
              placeholder="e.g. Approved 1 week as per branch policy..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
