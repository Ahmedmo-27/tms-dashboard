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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FreezeRequestItem } from "@/lib/data/freeze";
import { rejectFreezeAction } from "@/lib/actions/freeze-actions";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getActionErrorMessage } from "@/lib/utils/api-error-message";

export function RejectFreezeDialog({
  request,
  onSuccess,
}: {
  request: FreezeRequestItem;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const memberName = request.memberId?.name ?? "Member";

  const handleReject = async () => {
    try {
      setLoading(true);
      const res = await rejectFreezeAction(
        request._id,
        rejectionReason.trim() || undefined
      );

      if (res.success) {
        toast.success("Freeze request rejected.");
        setOpen(false);
        onSuccess?.();
      } else {
        const errorMsg = getActionErrorMessage(res, "Failed to reject freeze request");
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
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 gap-1">
          <X className="h-4 w-4" />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Reject Extra Freeze Request</DialogTitle>
          <DialogDescription>
            Decline extra freeze request for <strong>{memberName}</strong>.
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
              <span>{request.requestedDurationDays} Days</span>
            </div>
            <div className="pt-1">
              <span className="text-muted-foreground block mb-1">Member's Reason:</span>
              <p className="italic bg-background/80 p-2 rounded border text-xs">
                "{request.reason}"
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Reason for Rejection (Optional)</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Provide a reason to notify the member..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
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
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
