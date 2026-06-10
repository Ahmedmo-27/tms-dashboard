"use client";

import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Payment } from "./columns";
import { getOutflowBadgeLabel, isOutflowTransaction } from "@/lib/utils/parsers/payments-parser";

function parseAmount(amount: Payment["amount"]): number {
  return typeof amount === "string"
    ? parseFloat(amount.replace(/[^0-9.-]+/g, ""))
    : parseFloat(String(amount));
}

interface OutflowDetailsDialogProps {
  payment: Payment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function OutflowDetailsDialog({
  payment,
  open,
  onOpenChange,
}: OutflowDetailsDialogProps) {
  const isCashOut = !!payment.isCashOut;
  const title = isCashOut ? "Cash Out Details" : "Member Refund Details";
  const numericAmount = parseAmount(payment.amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isCashOut
              ? "Cash removed from the register."
              : "Refund issued to a member."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              {isCashOut ? "Cash Out" : "Member Refund"}
            </Badge>
          </div>

          {!isCashOut && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Member</p>
                <p className="text-sm font-medium">{payment.memberName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{payment.phone}</p>
              </div>
              {payment.paymentLabel && (
                <div>
                  <p className="text-xs text-muted-foreground">Refunded for</p>
                  <p className="text-sm font-medium">{payment.paymentLabel}</p>
                </div>
              )}
            </>
          )}

          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-sm font-mono font-semibold text-red-600 dark:text-red-400">
              -EGP {Math.abs(numericAmount).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Recorded at</p>
            <p className="text-sm font-medium">
              {formatInTimeZone(new Date(payment.paymentTime), "Africa/Cairo", "dd MMM yyyy, HH:mm")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Reason</p>
            <p className="text-sm whitespace-pre-wrap rounded-md border bg-muted/40 p-3">
              {payment.refundReason || payment.purpose || "No reason provided."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface OutflowDetailsTriggerProps {
  payment: Payment;
  className?: string;
}

export function OutflowDetailsTrigger({
  payment,
  className,
}: OutflowDetailsTriggerProps) {
  const [open, setOpen] = useState(false);
  const isOutflow = isOutflowTransaction(payment);

  if (!isOutflow) {
    return (
      <Badge
        variant="outline"
        className={`font-normal text-xs max-w-full whitespace-normal break-words text-left leading-snug h-auto items-start justify-start py-1 ${className ?? ""}`}
      >
        {payment.purpose}
      </Badge>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="link"
        className={`h-auto p-0 text-xs font-normal text-primary underline-offset-4 hover:underline ${className ?? ""}`}
        onClick={() => setOpen(true)}
      >
        Click here to view reason
      </Button>
      <OutflowDetailsDialog
        payment={payment}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function OutflowPurposeCell({
  payment,
  badgeClassName,
}: {
  payment: Payment;
  badgeClassName?: string;
}) {
  const isOutflow = isOutflowTransaction(payment);

  return (
    <div className="max-w-[160px] flex flex-col gap-1">
      <OutflowDetailsTrigger payment={payment} />
      {isOutflow && (
        <Badge
          variant="destructive"
          className={
            badgeClassName ??
            "font-normal text-[10px] px-1 py-0 h-4 truncate w-fit"
          }
        >
          {getOutflowBadgeLabel(payment)}
        </Badge>
      )}
    </div>
  );
}
