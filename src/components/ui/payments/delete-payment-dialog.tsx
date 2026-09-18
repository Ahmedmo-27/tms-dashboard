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
import { deletePayment } from "@/lib/data/payments";
import { Payment } from "./columns";
import { toast } from "react-hot-toast";
import { AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";

interface DeletePaymentDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentDeleted: () => void;
}

export function DeletePaymentDialog({
  payment,
  open,
  onOpenChange,
  onPaymentDeleted,
}: DeletePaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!payment) return null;

  const paymentId = payment._id || payment.id;
  const isRefunded = Boolean(payment.isRefunded);

  const numericAmount = typeof payment.amount === "string"
    ? parseFloat(payment.amount.replace(/[^0-9.-]+/g, ""))
    : parseFloat(String(payment.amount));

  const formattedDate = payment.paymentTime
    ? formatInTimeZone(new Date(payment.paymentTime), "Africa/Cairo", "MMM dd, yyyy · hh:mm a")
    : "—";

  const handleDelete = async () => {
    if (!paymentId) {
      toast.error("Invalid payment record ID");
      return;
    }

    if (isRefunded) {
      toast.error("Cannot delete a payment that has been refunded.");
      return;
    }

    setIsSubmitting(true);
    try {
      await deletePayment(paymentId);
      toast.success("Payment record has been permanently deleted.");
      onOpenChange(false);
      onPaymentDeleted();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to delete payment record";
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
            Delete Payment Record
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this payment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Payment Summary Box */}
        <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Payer / Member:</span>
            <span className="font-semibold text-foreground truncate max-w-[220px]">
              {payment.memberName || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Amount:</span>
            <span className="font-mono font-bold text-foreground">
              EGP {isNaN(numericAmount) ? payment.amount : Math.abs(numericAmount).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Method / Purpose:</span>
            <span className="text-xs text-foreground">
              {payment.paymentMethod} ({payment.purpose})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Recorded Date:</span>
            <span className="text-xs text-foreground">{formattedDate}</span>
          </div>
          {payment.location && payment.location !== " -- " && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">Branch:</span>
              <span className="text-xs text-foreground">{payment.location}</span>
            </div>
          )}
        </div>

        {isRefunded ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Refund Safeguard:</strong> This payment is marked as refunded. Refunded payments cannot be deleted in order to preserve transaction and accounting history.
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
            Deleting this record will permanently remove it from revenue accounting, cash register balances, and daily sheet summaries.
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
            disabled={isSubmitting || isRefunded}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
