"use client";

import { useEffect, useMemo, useState } from "react";
import { eachDayOfInterval, format, formatDate, isAfter, startOfDay } from "date-fns";
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
import { ExportBranchSelector } from "@/components/ui/payments/export-branch-selector";
import { useLocations } from "@/lib/hooks/use-locations";
import { useBranchContext } from "@/lib/hooks/use-branch-context";
import { getSheetDay } from "@/lib/data/daily-sheet";
import {
  buildUncompressedZip,
  dailySheetCsvFilename,
  downloadBlob,
  serializeDailySheetCsv,
  toSerializableSheetDay,
} from "@/lib/utils/daily-sheet-csv";
import { isRateLimitError, withRetry } from "@/lib/utils/retry-request";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ExportSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetDate: Date;
  locationId?: string;
}

export function ExportSheetDialog({
  open,
  onOpenChange,
  sheetDate,
  locationId,
}: ExportSheetDialogProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [activeDateField, setActiveDateField] = useState<"from" | "to" | null>(null);
  const { locations, isLoading: isLoadingLocations } = useLocations(true);
  const { isManagement, userLocationId } = useBranchContext();
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(
    null
  );

  const availableLocations = useMemo(
    () =>
      isManagement
        ? locations
        : locations.filter((location) => location._id === userLocationId),
    [isManagement, locations, userLocationId]
  );

  useEffect(() => {
    if (!open) return;
    setFromDate(sheetDate);
    setToDate(sheetDate);
    setProgress(null);
    setSelectedBranchIds((current) => {
      if (current.length > 0) {
        return current.filter((id) =>
          availableLocations.some((location) => location._id === id)
        );
      }
      if (locationId && availableLocations.some((l) => l._id === locationId)) {
        return [locationId];
      }
      return availableLocations.map((location) => location._id);
    });
  }, [open, sheetDate, locationId, availableLocations]);

  const resetForm = () => {
    setActiveDateField(null);
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
      availableLocations
        .filter((location) => selectedBranchIds.includes(location._id))
        .map((location) => location.branchName),
    [availableLocations, selectedBranchIds]
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

    const branches = availableLocations.filter((location) =>
      selectedBranchIds.includes(location._id)
    );
    const days = eachDayOfInterval({
      start: startOfDay(fromDate!),
      end: startOfDay(toDate!),
    });
    const total = days.length * branches.length;
    if (total === 0) {
      toast.error("Nothing to export.");
      return;
    }

    setIsExporting(true);
    setProgress({ completed: 0, total });

    try {
      const files: Array<{ name: string; content: string }> = [];
      let completed = 0;

      for (const day of days) {
        const dateKey = format(day, "yyyy-MM-dd");
        for (const branch of branches) {
          const dayData = await withRetry(() =>
            getSheetDay(dateKey, branch._id)
          );
          files.push({
            name: dailySheetCsvFilename(dateKey, branch.branchName),
            content: serializeDailySheetCsv(toSerializableSheetDay(dayData)),
          });
          completed += 1;
          setProgress({ completed, total });
          if (completed < total) await sleep(400);
        }
      }

      if (files.length === 1) {
        downloadBlob(
          new Blob([files[0].content], { type: "text/csv;charset=utf-8" }),
          files[0].name
        );
      } else {
        downloadBlob(
          buildUncompressedZip(files),
          `DAILY CHECK INS - ${dates.from} to ${dates.to}.zip`
        );
      }

      toast.success(
        files.length === 1
          ? "Downloaded 1 sheet CSV."
          : `Downloaded ${files.length} sheet CSVs.`
      );
      handleOpenChange(false);
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(
          "The server is receiving too many requests. Try a shorter date range or wait a minute and retry."
        );
      } else {
        toast.error(getApiErrorMessage(error) || "Failed to export the sheet.");
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
      : selectedBranchNames.length === availableLocations.length
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
            <DialogTitle>Export sheet CSV</DialogTitle>
            <DialogDescription>
              Download the daily check-in layout for the branches and dates you pick.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <ExportBranchSelector
              locations={availableLocations}
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
                Exporting sheets from{" "}
                <span className="font-medium text-foreground">{rangeSummary}</span> for{" "}
                <span className="font-medium text-foreground">{branchSummary}</span>.
              </p>
            )}

            {isExporting && progress && (
              <p className="text-sm text-muted-foreground">
                Fetching {progress.completed} of {progress.total}…
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
            onClick={() => void handleExport()}
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
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
