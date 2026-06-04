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
import { deletePackageAction } from "@/lib/actions/package-actions";
import { Trash } from "lucide-react";

export default function DeletePackageDialog({
  pkg,
}: {
  pkg: { name: string; _id: string };
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deletePackageAction(pkg._id);
      setOpen(false);
    } catch (error) {
      console.error('Failed to delete package:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <div className="w-full">
          <Button
            onSelect={(e) => e.preventDefault()}
            variant="outline"
            className="cursor-pointer text-destructive hover:text-destructive w-full"
          >
            <Trash className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden">Delete</span>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete {pkg.name}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            package.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
          <Button
            type="button"
            className="cursor-pointer w-full sm:w-auto"
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
