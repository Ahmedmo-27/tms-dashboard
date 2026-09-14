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
import { cancelClassAction } from "@/lib/actions/schedule-actions";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { getActionErrorMessage } from "@/lib/utils/api-error-message";

export default function CancelClassDialog({
  scls,
  variant = "none",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  scls: ScheduledClass;
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
      const result = await cancelClassAction(scls._id as string);
      if (result.success) {
        toast.success("Class cancelled successfully");
        setOpen(false);
        return;
      }
      const message = getActionErrorMessage(result, "Failed to cancel class");
      setError(message);
      toast.error(message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel class";
      console.error("Failed to delete class:", err);
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
          Cancel Class
        </Button>
      )}
      {variant === "menu" && (
        <DropdownMenuItem
          onSelect={() => setOpen(true)}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          Cancel Class
        </DropdownMenuItem>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Are you sure you want to cancel {scls.className}?</DialogTitle>
            <DialogDescription>
              Make sure you contacted all booked members.
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
