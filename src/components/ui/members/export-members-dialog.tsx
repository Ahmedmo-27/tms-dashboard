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
import { DialogDatePicker } from "@/components/ui/payments/dialog-date-picker";
import { getMembersForExport } from "@/lib/data/member";
import { downloadMembersExcel } from "@/lib/utils/export-members";
import { isRateLimitError } from "@/lib/utils/retry-request";

interface ExportMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportMembersDialog({
  open,
  onOpenChange,
}: ExportMembersDialogProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [activeDateField, setActiveDateField] = useState<"from" | "to" | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);

  const resetForm = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setActiveDateField(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Keep the dialog open while the export request is in flight.
    if (!nextOpen && isExporting) return;
    if (!nextOpen) resetForm();
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

    try {
      const members = await getMembersForExport(dates.from, dates.to);

      if (members.length === 0) {
        toast.error("No members found for the selected date range.");
        return;
      }

      downloadMembersExcel(members, dates.from, dates.to);
      toast.success(
        `Exported ${members.length} member${members.length === 1 ? "" : "s"} to Excel.`
      );
      handleOpenChange(false);
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(
          "The server is receiving too many requests. Try a shorter date range or wait a minute and retry."
        );
      } else {
        toast.error("Failed to export members. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const rangeSummary =
    fromDate && toDate
      ? `${format(fromDate, "MMM dd, yyyy")} – ${format(toDate, "MMM dd, yyyy")}`
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 max-sm:top-4 max-sm:translate-y-0 max-sm:max-h-[calc(100dvh-2rem)] sm:max-h-[min(90dvh,100vh)] sm:max-w-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>Export Members with ID</DialogTitle>
            <DialogDescription>
              Choose a creation date range. The Excel sheet includes each
              member&apos;s national ID.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <DialogDatePicker
              label="From"
              selectedDate={fromDate}
              onDateChange={setFromDate}
              placeholder="Select start date"
              open={activeDateField === "from"}
              onOpenChange={(isOpen) =>
                setActiveDateField(isOpen ? "from" : null)
              }
            />

            <DialogDatePicker
              label="To"
              selectedDate={toDate}
              onDateChange={setToDate}
              placeholder="Select end date"
              open={activeDateField === "to"}
              onOpenChange={(isOpen) => setActiveDateField(isOpen ? "to" : null)}
            />

            {rangeSummary && (
              <p className="text-sm text-muted-foreground rounded-md border bg-muted/40 p-3">
                Exporting members created from{" "}
                <span className="font-medium text-foreground">{rangeSummary}</span>
                .
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
            disabled={isExporting || !fromDate || !toDate}
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
