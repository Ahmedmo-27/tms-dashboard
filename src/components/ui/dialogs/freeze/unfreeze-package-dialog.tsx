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
import { adminUnfreezePackageAction } from "@/lib/actions/freeze-actions";
import { PlayCircle, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getActionErrorMessage } from "@/lib/utils/api-error-message";

export function UnfreezePackageDialog({
  memberId,
  memberName,
  pkgId,
  pkgName,
  pkgStartDate,
  freezeEndDate,
  onSuccess,
}: {
  memberId: string;
  memberName: string;
  pkgId: string;
  pkgName: string;
  pkgStartDate: string;
  freezeEndDate?: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnfreeze = async () => {
    try {
      setLoading(true);
      const res = await adminUnfreezePackageAction(memberId, pkgId, pkgStartDate);

      if (res.success) {
        toast.success(`Package "${pkgName}" has been unfrozen successfully!`);
        setOpen(false);
        onSuccess?.();
      } else {
        const errorMsg = getActionErrorMessage(res, "Failed to unfreeze package");
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
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Unfreeze
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <PlayCircle className="h-5 w-5" />
            Unfreeze Package Early
          </DialogTitle>
          <DialogDescription>
            Unfreezing will reactivate the package immediately for member{" "}
            <strong>{memberName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="rounded-lg bg-muted/60 p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member:</span>
              <span className="font-medium">{memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package:</span>
              <span className="font-medium">{pkgName}</span>
            </div>
            {freezeEndDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Freeze End:</span>
                <span className="font-medium">
                  {format(new Date(freezeEndDate), "dd MMM yyyy")}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 flex gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <p className="font-semibold">Automatic Freeze Refund:</p>
              <p className="mt-0.5">
                Unused frozen days will be refunded back to the member's freeze quota and the package expiry will be automatically updated to reflect the actual days used.
              </p>
            </div>
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleUnfreeze}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Unfreeze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
