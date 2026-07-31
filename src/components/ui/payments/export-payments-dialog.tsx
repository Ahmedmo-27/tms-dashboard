"use client";

import { useEffect, useMemo, useState } from "react";
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
import { DialogDatePicker } from "./dialog-date-picker";
import { ExportBranchSelector } from "./export-branch-selector";
import { useLocations } from "@/lib/hooks/use-locations";
import { getPaymentsForDateRange } from "@/lib/data/payments";
import { downloadPaymentsExcel } from "@/lib/utils/export-payments";
import { isRateLimitError } from "@/lib/utils/retry-request";

interface ExportPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportPaymentsDialog({
  open,
  onOpenChange,
}: ExportPaymentsDialogProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [activeDateField, setActiveDateField] = useState<"from" | "to" | null>(null);
  const { locations, isLoading: isLoadingLocations } = useLocations(true);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(
    null
  );

  useEffect(() => {
    if (!open || locations.length === 0) return;

    setSelectedBranchIds((current) => {
      if (current.length > 0) return current;
      return locations.map((location) => location._id);
    });
  }, [open, locations]);

  const resetForm = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setActiveDateField(null);
    setSelectedBranchIds([]);
    setProgress(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isExporting) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const selectedBranchNames = useMemo(
    () =>
      locations
        .filter((location) => selectedBranchIds.includes(location._id))
        .map((location) => location.branchName),
    [locations, selectedBranchIds]
  );

  const validateDates = (): { from: string; to: string } | null => {
    if (!fromDate || !toDate) {
      toast.error("Please select both a start date and an end date.");
      return null;
    }

    if (selectedBranchIds.length === 0) {
      toast.error("Please select at least one branch.");
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
      const branches = locations
        .filter((location) => selectedBranchIds.includes(location._id))
        .map((location) => ({
          id: location._id,
          branchName: location.branchName,
        }));

      const payments = await getPaymentsForDateRange(
        dates.from,
        dates.to,
        branches,
        (completed, total) => setProgress({ completed, total })
      );

      if (payments.length === 0) {
        toast.error("No payments found for the selected date range and branches.");
        return;
      }

      downloadPaymentsExcel(payments, dates.from, dates.to);
      toast.success(
        `Exported ${payments.length} payment${payments.length === 1 ? "" : "s"} to Excel.`
      );
      handleOpenChange(false);
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(
          "The server is receiving too many requests. Try a shorter date range or wait a minute and retry."
        );
      } else {
        toast.error("Failed to export payments. Please try again.");
      }
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  const rangeSummary =
    fromDate && toDate
      ? `${format(fromDate, "MMM dd, yyyy")} – ${format(toDate, "MMM dd, yyyy")}`
      : null;

  const branchSummary =
    selectedBranchNames.length === 0
      ? null
      : selectedBranchNames.length === locations.length
        ? "all branches"
        : selectedBranchNames.join(", ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 max-sm:top-4 max-sm:translate-y-0 max-sm:max-h-[calc(100dvh-2rem)] sm:max-h-[min(90dvh,100vh)] sm:max-w-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>Export Payments to Excel</DialogTitle>
            <DialogDescription>
              Choose branches and a date range for one combined Excel sheet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <ExportBranchSelector
              locations={locations}
              selectedIds={selectedBranchIds}
              onChange={setSelectedBranchIds}
              disabled={isExporting}
              isLoading={isLoadingLocations}
            />

            <DialogDatePicker
              label="From"
              selectedDate={fromDate}
              onDateChange={setFromDate}
              placeholder="Select start date"
              open={activeDateField === "from"}
              onOpenChange={(isOpen) => setActiveDateField(isOpen ? "from" : null)}
            />

            <DialogDatePicker
              label="To"
              selectedDate={toDate}
              onDateChange={setToDate}
              placeholder="Select end date"
              open={activeDateField === "to"}
              onOpenChange={(isOpen) => setActiveDateField(isOpen ? "to" : null)}
            />

            {rangeSummary && branchSummary && (
              <p className="text-sm text-muted-foreground rounded-md border bg-muted/40 p-3">
                Exporting payments from{" "}
                <span className="font-medium text-foreground">{rangeSummary}</span> for{" "}
                <span className="font-medium text-foreground">{branchSummary}</span>.
              </p>
            )}

            {isExporting && progress && (
              <p className="text-sm text-muted-foreground">
                Fetching day {progress.completed} of {progress.total}…
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="relative z-10 shrink-0 border-t bg-background p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isExporting}
            className="min-h-[44px] touch-manipulation sm:min-h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              !fromDate ||
              !toDate ||
              selectedBranchIds.length === 0
            }
            className="min-h-[44px] touch-manipulation sm:min-h-9"
          >
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
