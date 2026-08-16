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
import { unsubscribePackageAction } from "@/lib/actions/member-actions";
import { toast } from "react-hot-toast";

export default function CancelPackageDialog({
  uid,
  pkg,
}: {
  uid: string;
  pkg: {
    name: string;
    remainingClasses: number;
    _id: string;
    pkgStartDate: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setError(null);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      const result = await unsubscribePackageAction(
        uid,
        pkg._id as string,
        pkg.pkgStartDate,
      );
      if (result.success) {
        toast.success("Package cancelled successfully");
        setOpen(false);
        return;
      }
      const message = result.errors?.message || "Failed to cancel package";
      setError(message);
      toast.error(message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel package";
      console.error("Failed to delete package:", err);
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <div className="w-full">
          <div
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer text-destructive hover:text-destructive w-full text-center"
          >
            Cancel Package
          </div>
        </div>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete {pkg.name}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            package.
          </DialogDescription>
          {error && (
            <DialogDescription className="text-red-500 whitespace-pre-wrap">
              {error}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            className="cursor-pointer"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              setError(null);
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
