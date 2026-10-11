"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { deleteScanRow } from "@/lib/data/scan-rows";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import type { ClassScan } from "@/components/ui/scans/class-container";

export function DeleteScanRow({
  scan,
  onDeleted,
}: {
  scan: ClassScan;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoreSession, setRestoreSession] = useState(true);

  // Classes take their credit at booking time, so removing the check-in never
  // hands a session back — the booking still holds it.
  const consumesSessionOnScan = scan.source !== "class";
  const wasSuccessful = scan.status !== "FAILED";

  const handleDelete = async () => {
    if (!scan.source || !scan.parentId || !scan.rowId) {
      toast.error("This row cannot be deleted");
      return;
    }
    try {
      setDeleting(true);
      await deleteScanRow(
        { source: scan.source, parentId: scan.parentId, rowId: scan.rowId },
        restoreSession,
      );
      toast.success("Check-in deleted");
      setOpen(false);
      onDeleted?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
          aria-label="Delete check-in"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Delete this check-in?</DialogTitle>
          <DialogDescription>
            {scan.member} · {scan.method}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {consumesSessionOnScan && wasSuccessful ? (
            <div className="flex items-start gap-2.5 rounded-lg border p-3">
              <Checkbox
                id="restore-session"
                checked={restoreSession}
                onCheckedChange={(v) => setRestoreSession(v === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="restore-session" className="cursor-pointer">
                  Return the session to the member
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Adds the deducted session back to the package this check-in
                  was charged to.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {wasSuccessful
                ? "The class credit was taken at booking time, so no session is returned. Cancel the booking instead if the member should get it back."
                : "This was a failed scan, so no session was taken."}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            The row is removed from Scans Monitor. This cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete check-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
