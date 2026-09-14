"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { unsubscribePackageAction } from "@/lib/actions/member-actions";
import { toast } from "react-hot-toast";
import { getActionErrorMessage } from "@/lib/utils/api-error-message";

export default function CancelPackageDialog({
  uid,
  pkg,
  variant = "none",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  uid: string;
  pkg: {
    name: string;
    remainingClasses: number;
    _id: string;
    pkgStartDate: string;
  };
  variant?: "menu" | "button" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

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
      const message = getActionErrorMessage(result, "Failed to cancel package");
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
    <>
      {variant === "button" && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => setOpen(true)}
        >
          Cancel Package
        </Button>
      )}
      {variant === "menu" && (
        <DropdownMenuItem
          onSelect={() => setOpen(true)}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          Cancel Package
        </DropdownMenuItem>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
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
    </>
  );
}
