"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Trash } from "lucide-react";
import { cancelBookingAction } from "@/lib/actions/member-actions";
import { toast } from "react-hot-toast";
import { getActionErrorMessage } from "@/lib/utils/api-error-message";

export default function CancelBookingDialog({
  scid,
  uid,
  title,
}: {
  scid: string;
  uid: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      const res = await cancelBookingAction(uid, scid);
      if (res.success) {
        toast.success("Booking cancelled successfully");
        setOpen(false);
      } else {
        const msg = getActionErrorMessage(res, "Failed to cancel booking");
        toast.error(msg);
        setError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel booking";
      toast.error(msg);
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          className="cursor-pointer text-destructive hover:text-destructive w-full"
          variant="outline"
        >
          <Trash />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to cancel booking {title}?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            class.
          </DialogDescription>
          {error && <DialogDescription className="text-red-500">{error}</DialogDescription>}
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            className="cursor-pointer"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            disabled={isDeleting}
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
