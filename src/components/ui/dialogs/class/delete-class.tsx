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
import { deleteClassAction } from "@/lib/actions/class-actions";
import { Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import { getActionErrorMessage } from "@/lib/utils/api-error-message";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DeleteClassDialog({
  cls,
  compact = false,
  buttonClassName,
}: {
  cls: { title: string; _id: string };
  compact?: boolean;
  buttonClassName?: string;
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
      const result = await deleteClassAction(cls._id);
      if (result.success) {
        toast.success("Class deleted successfully");
        setOpen(false);
        return;
      }
      const message = getActionErrorMessage(result, "Failed to delete class");
      setError(message);
      toast.error(message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete class";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerButton = (
    <Button
      type="button"
      className={cn(
        "cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10",
        compact ? "h-9 w-9 shrink-0" : "w-full",
        buttonClassName
      )}
      variant="outline"
      size={compact ? "icon" : "default"}
    >
      <Trash className={compact ? "size-4.5" : "mr-2 h-4 w-4"} />
      {!compact && <span>Delete</span>}
      {compact && <span className="sr-only">Delete Class</span>}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
              {triggerButton}
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Delete Class</TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
          {triggerButton}
        </DialogTrigger>
      )}
      <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete {cls.title}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            class.
          </DialogDescription>
          {error && (
            <DialogDescription className="text-red-500 whitespace-pre-wrap">
              {error}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
          <Button
            type="button"
            className="cursor-pointer w-full sm:w-auto"
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
            className="cursor-pointer w-full sm:w-auto"
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
