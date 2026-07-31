"use client";

import { useState } from "react";
import { format, formatDate, isAfter, startOfDay } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentDatePicker } from "./date-picker";
import { getPaymentsForDateRange } from "@/lib/data/payments";
import { downloadPaymentsExcel } from "@/lib/utils/export-payments";

interface ExportPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId?: string;
}

export function ExportPaymentsDialog({
  open,
  onOpenChange,
  locationId,
}: ExportPaymentsDialogProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(
    null
  );

  const resetForm = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setProgress(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isExporting) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const validateDates = (): { from: string; to: string } | null => {
    if (!fromDate || !toDate) {
      toast.error("Please select both a start date and an end date.");
      return null;
    }

    const from = startOfDay(fromDate);
    const to = startOfDay(toDate);

    if (isAfter(from, to)) {
      toast.error("Start date must be before or equal to the end date.");
      return null;
    }

    return {
      from: formatDate(from, "yyyy-MM-dd"),
      to: formatDate(to, "yyyy-MM-dd"),
    };
  };

  const handleExport = async () => {
    const dates = validateDates();
    if (!dates) return;

    setIsExporting(true);
    setProgress(null);

    try {
      const payments = await getPaymentsForDateRange(
        dates.from,
        dates.to,
        locationId,
        (completed, total) => setProgress({ completed, total })
      );

      if (payments.length === 0) {
        toast.error("No payments found for the selected date range.");
        return;
      }

      downloadPaymentsExcel(payments, dates.from, dates.to);
      toast.success(
        `Exported ${payments.length} payment${payments.length === 1 ? "" : "s"} to Excel.`
      );
      handleOpenChange(false);
    } catch {
      toast.error("Failed to export payments. Please try again.");
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  const rangeSummary =
    fromDate && toDate
      ? `${format(fromDate, "MMM dd, yyyy")} – ${format(toDate, "MMM dd, yyyy")}`
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Payments to Excel</DialogTitle>
          <DialogDescription>
            Choose the date range for your export. You can pick any start and end
            dates, including across different months and years.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">From</p>
            <PaymentDatePicker
              className="w-full"
              selectedDate={fromDate}
              onDateChange={setFromDate}
              placeholder="Select start date"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">To</p>
            <PaymentDatePicker
              className="w-full"
              selectedDate={toDate}
              onDateChange={setToDate}
              placeholder="Select end date"
            />
          </div>

          {rangeSummary && (
            <p className="text-sm text-muted-foreground rounded-md border bg-muted/40 p-3">
              Exporting payments from{" "}
              <span className="font-medium text-foreground">{rangeSummary}</span>
              {locationId ? " for the selected branch." : " across all branches."}
            </p>
          )}

          {isExporting && progress && (
            <p className="text-sm text-muted-foreground">
              Fetching day {progress.completed} of {progress.total}…
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !fromDate || !toDate}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
