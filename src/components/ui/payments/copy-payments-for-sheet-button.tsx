"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCopy } from "lucide-react";
import type { Payment } from "./columns";
import { buildPaymentsSheetClipboardText } from "@/lib/utils/copy-payments-for-sheet";
import { toast } from "react-hot-toast";

type CopyPaymentsForSheetButtonProps = {
  payments: Payment[];
};

export function CopyPaymentsForSheetButton({
  payments,
}: CopyPaymentsForSheetButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    () => new Set()
  );

  const selectedCount = selectedIndexes.size;
  const allSelected =
    payments.length > 0 && selectedCount === payments.length;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelectedIndexes(new Set());
    }
  };

  const toggleIndex = (index: number, checked: boolean) => {
    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  const selectAll = () =>
    setSelectedIndexes(new Set(payments.map((_, i) => i)));
  const clearAll = () => setSelectedIndexes(new Set());

  const handleCopy = async () => {
    const selectedPayments = payments.filter((_, index) =>
      selectedIndexes.has(index)
    );
    const sheetText = buildPaymentsSheetClipboardText(selectedPayments);

    if (!sheetText) {
      toast.error("Select at least one payment to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(sheetText);
      toast.success(
        selectedPayments.length === 1
          ? "Copied 1 payment for sheet"
          : `Copied ${selectedPayments.length} payments for sheet`
      );
      setOpen(false);
    } catch {
      toast.error("Failed to copy payments");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={payments.length === 0}
          className="h-9 flex-1 sm:flex-none"
        >
          <ClipboardCopy className="h-4 w-4 sm:mr-2" />
          <span>Copy for sheet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy payments for sheet</DialogTitle>
          <DialogDescription>
            Choose which payments to copy. The data will be formatted as
            tab-separated rows ready to paste into your spreadsheet.
          </DialogDescription>
        </DialogHeader>

        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No payments to copy.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Payments</p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={selectAll}
                  disabled={allSelected}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={clearAll}
                  disabled={selectedCount === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <div className="divide-y">
                {payments.map((payment, index) => {
                  const checked = selectedIndexes.has(index);
                  const amount = payment.amount
                    ? String(payment.amount).replace(/[^0-9.-]+/g, "")
                    : "";

                  return (
                    <label
                      key={`${payment.memberName}-${index}`}
                      className="flex items-start gap-3 p-3 min-h-[44px] cursor-pointer hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleIndex(index, value === true)
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {payment.memberName || "Unknown"}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {payment.purpose || "—"}
                          {amount && ` · ${amount} ${payment.paymentMethod}`}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              {selectedCount} of {payments.length} selected
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={selectedCount === 0}
          >
            Copy selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
