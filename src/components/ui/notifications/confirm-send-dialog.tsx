"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, AlertTriangle, Users, Bell, Loader2 } from "lucide-react";

interface ConfirmSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  targetType: string;
  recipientCount: number;
  branchName?: string;
  isSending: boolean;
  onConfirm: () => void;
}

const TARGET_LABELS: Record<string, string> = {
  custom: "Specific Selected Users",
  all: "Broadcast to ALL App Users",
  members: "All Registered Members",
  branch: "Branch Members",
  coaches: "Coaches & Staff",
};

export function ConfirmSendDialog({
  open,
  onOpenChange,
  title,
  body,
  targetType,
  recipientCount,
  branchName,
  isSending,
  onConfirm,
}: ConfirmSendDialogProps) {
  const isBroadCast = targetType === "all" || targetType === "members";

  return (
    <Dialog open={open} onOpenChange={(val) => !isSending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${isBroadCast ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"}`}>
              {isBroadCast ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </div>
            <DialogTitle>Confirm Push Notification Dispatch</DialogTitle>
          </div>
          <DialogDescription>
            Please review the notification details before sending. This message will be delivered directly to users&apos; mobile devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Target Audience Summary */}
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Target Audience
              </span>
            </div>
            <div className="font-medium text-foreground">
              {TARGET_LABELS[targetType] || targetType}
              {targetType === "branch" && branchName && ` (${branchName})`}
            </div>
            {targetType === "custom" && (
              <div className="text-xs text-muted-foreground">
                Total Selected: <span className="font-semibold text-foreground">{recipientCount} user(s)</span>
              </div>
            )}
            {isBroadCast && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ This notification will be received by all registered mobile devices.
              </div>
            )}
          </div>

          {/* Message Preview Box */}
          <div className="rounded-lg border p-3 space-y-2 bg-background">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5 text-primary" /> Message Preview
            </div>
            <div className="font-bold text-foreground text-sm leading-snug">
              {title || "THE MIND SPACE."}
            </div>
            <div className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">
              {body}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSending}
            onClick={onConfirm}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Dispatch Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
