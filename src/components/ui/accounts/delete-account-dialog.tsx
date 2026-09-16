"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/data/accounts";
import type { UserAccount } from "@/types/accounts";
import { toast } from "react-hot-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";

interface DeleteAccountDialogProps {
  account: UserAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountDeleted: () => void;
}

export function DeleteAccountDialog({
  account,
  open,
  onOpenChange,
  onAccountDeleted,
}: DeleteAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.user);

  if (!account) return null;

  const isSelf = currentUser?.id === account._id;

  const handleDelete = async () => {
    if (isSelf) {
      toast.error("You cannot delete your own logged-in management account.");
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteAccount(account._id);
      toast.success(`Account for ${account.name} has been deleted.`);
      onOpenChange(false);
      onAccountDeleted();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to delete account";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete the account for{" "}
            <span className="font-semibold text-foreground">{account.name}</span> ({account.phoneNumber})?
          </DialogDescription>
        </DialogHeader>

        {isSelf ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <strong>Self-Deletion Safeguard:</strong> This is your currently logged-in account. You cannot delete yourself.
          </div>
        ) : (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
            This will remove this user's administrative access and revoke all active login sessions immediately.
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting || isSelf}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

