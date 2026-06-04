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
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Trash, X } from "lucide-react";
import { cancelBooking } from "@/lib/data/bookings";
import { toast } from "react-hot-toast";

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
      await cancelBooking(uid, scid);
      toast.success("Booking cancelled successfully");
      setOpen(false);
    } catch (error) {
      toast.error((error as Error).message || "Failed to cancel booking");
      setError((error as Error).message)
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          onSelect={(e) => e.preventDefault()}
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
