"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2, Upload } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogDatePicker } from "@/components/ui/payments/dialog-date-picker";
import { useLocations } from "@/lib/hooks/use-locations";
import { useBranchContext } from "@/lib/hooks/use-branch-context";
import { importSheetDay } from "@/lib/data/daily-sheet";
import {
  parseDailySheetCsv,
  parseSheetCsvFilenameDate,
  sheetCsvHeaderDateToIso,
  type ParsedDailySheetCsv,
} from "@/lib/utils/daily-sheet-csv";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import type { SheetImportResponse } from "./types";

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

interface ImportSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetDate: Date;
  locationId?: string;
  onImported?: (date: string, locationId: string) => void;
}

export function ImportSheetDialog({
  open,
  onOpenChange,
  sheetDate,
  locationId,
  onImported,
}: ImportSheetDialogProps) {
  const { locations, isLoading: isLoadingLocations } = useLocations(true);
  const { isManagement, userLocationId } = useBranchContext();
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedDailySheetCsv | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState<Date | undefined>(sheetDate);
  const [csvDate, setCsvDate] = useState<Date | undefined>(undefined);
  const [mismatchAcknowledged, setMismatchAcknowledged] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<SheetImportResponse | null>(null);

  const availableLocations = useMemo(
    () =>
      isManagement
        ? locations
        : locations.filter((location) => location._id === userLocationId),
    [isManagement, locations, userLocationId]
  );

  // Reset on open only: availableLocations changes identity when the locations
  // query resolves, which would otherwise wipe a date the user just picked.
  const openDefaults = useRef({ sheetDate, locationId, availableLocations });
  openDefaults.current = { sheetDate, locationId, availableLocations };

  useEffect(() => {
    if (!open) return;
    const {
      sheetDate: initialDate,
      locationId: preferred,
      availableLocations: options,
    } = openDefaults.current;
    setDate(initialDate);
    setCsvDate(undefined);
    setMismatchAcknowledged(false);
    setReport(null);
    setParseError(null);
    const locked = options[0]?._id || "";
    setBranchId(
      preferred && options.some((l) => l._id === preferred) ? preferred : locked
    );
  }, [open]);

  // The branch list can arrive after the dialog opens.
  useEffect(() => {
    if (!open || branchId) return;
    const preferred = locationId;
    const locked = availableLocations[0]?._id || "";
    const next =
      preferred && availableLocations.some((l) => l._id === preferred)
        ? preferred
        : locked;
    if (next) setBranchId(next);
  }, [open, branchId, locationId, availableLocations]);

  const resetFile = () => {
    setFileName("");
    setParsed(null);
    setParseError(null);
    setReport(null);
    setCsvDate(undefined);
    setMismatchAcknowledged(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !importing) {
      resetFile();
      setDatePickerOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const handleFile = async (file: File | undefined) => {
    resetFile();
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const next = parseDailySheetCsv(text);
      const people =
        next.classes.reduce((sum, block) => sum + block.rows.length, 0) +
        next.spacePt.length;
      if (people === 0) {
        setParseError("This CSV has no people rows.");
        return;
      }
      setParsed(next);
      const fromName = parseSheetCsvFilenameDate(file.name);
      const fromHeader = sheetCsvHeaderDateToIso(
        next.headerDate,
        fromName ? Number(fromName.slice(0, 4)) : sheetDate.getFullYear()
      );
      const detected = fromHeader || fromName;
      if (detected) {
        const detectedDate = parseLocalDate(detected);
        setCsvDate(detectedDate);
        setDate(detectedDate);
        setMismatchAcknowledged(false);
      }
    } catch {
      setParseError("Could not read that CSV. Export from Google Sheets as CSV and try again.");
    }
  };

  const peoplePreview = parsed
    ? parsed.classes.reduce((sum, block) => sum + block.rows.length, 0) +
      parsed.spacePt.length
    : 0;

  const dateMismatch = Boolean(
    parsed && csvDate && date && format(csvDate, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")
  );
  const needsDateConfirm = dateMismatch && !mismatchAcknowledged;

  const handleImport = async () => {
    if (!parsed || !date || !branchId) {
      toast.error("Choose a CSV, branch, and date.");
      return;
    }

    if (needsDateConfirm) {
      setMismatchAcknowledged(true);
      return;
    }

    setImporting(true);
    setReport(null);
    try {
      const dateKey = format(date, "yyyy-MM-dd");
      const result = await importSheetDay({
        date: dateKey,
        locationId: branchId,
        classes: parsed.classes.map((block) => ({
          title: block.title,
          coachName: block.coachName,
          rows: block.rows,
        })),
        spacePt: parsed.spacePt,
      });
      setReport(result);

      if (result.summary.failed === 0) {
        toast.success(
          result.summary.skipped
            ? `Imported ${result.summary.ok}, skipped ${result.summary.skipped}.`
            : `Imported ${result.summary.ok} row${result.summary.ok === 1 ? "" : "s"}.`
        );
      } else {
        toast.error(
          `${result.summary.failed} row${result.summary.failed === 1 ? "" : "s"} failed. Fix the CSV and retry.`
        );
      }

      if (result.summary.ok + result.summary.skipped > 0) {
        onImported?.(dateKey, branchId);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error) || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const failedRows = report?.results.filter((row) => !row.ok) ?? [];

  const rowLabel = (clientRowId: string) => {
    if (!parsed) return clientRowId;
    const classMatch = clientRowId.match(/^import:class:(\d+):(\d+)$/);
    if (classMatch) {
      const block = parsed.classes[Number(classMatch[1])];
      const person = block?.rows[Number(classMatch[2])];
      return person
        ? `${person.name} (${block.title})`
        : clientRowId;
    }
    const spaceMatch = clientRowId.match(/^import:space:(\d+)$/);
    if (spaceMatch) {
      return parsed.spacePt[Number(spaceMatch[1])]?.name || clientRowId;
    }
    return clientRowId;
  };

  const lockedBranch = availableLocations.length === 1 ? availableLocations[0] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 max-sm:top-4 max-sm:translate-y-0 max-sm:max-h-[calc(100dvh-2rem)] sm:max-h-[min(90dvh,100vh)] sm:max-w-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>Import sheet CSV</DialogTitle>
            <DialogDescription>
              Writes attendance, payments, PT, and Space for this file immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="sheet-csv">CSV file</Label>
              <Input
                id="sheet-csv"
                type="file"
                accept=".csv,text/csv"
                disabled={importing}
                className="cursor-pointer file:cursor-pointer"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              {fileName ? (
                <p className="text-xs text-muted-foreground">{fileName}</p>
              ) : null}
              {parseError ? (
                <p className="text-sm text-destructive">{parseError}</p>
              ) : null}
              {parsed ? (
                <p className="text-sm text-muted-foreground">
                  {parsed.classes.length} class
                  {parsed.classes.length === 1 ? "" : "es"}, {parsed.spacePt.length}{" "}
                  SPACE/PT, {peoplePreview} people.
                </p>
              ) : null}
            </div>

            {lockedBranch ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Branch</p>
                <div className="rounded-md border bg-muted/40 px-3 py-3 text-sm">
                  {lockedBranch.branchName}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={branchId || undefined}
                  onValueChange={setBranchId}
                  disabled={importing || isLoadingLocations}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map((location) => (
                      <SelectItem key={location._id} value={location._id}>
                        {location.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <DialogDatePicker
                label="Date"
                selectedDate={date}
                onDateChange={(next) => {
                  setDate(next);
                  setMismatchAcknowledged(false);
                }}
                placeholder="Select date"
                open={datePickerOpen}
                onOpenChange={setDatePickerOpen}
              />
              {date ? (
                <p className="text-sm text-muted-foreground">
                  Rows will be written to {format(date, "EEEE d MMMM yyyy")}.
                </p>
              ) : null}
              {dateMismatch && csvDate && date ? (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  This CSV is dated {format(csvDate, "EEEE d MMMM yyyy")}, but you
                  chose {format(date, "EEEE d MMMM yyyy")}.{" "}
                  {mismatchAcknowledged
                    ? "Import will use the date you chose."
                    : "Press Import again to confirm."}
                </p>
              ) : null}
            </div>

            {report ? (
              <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
                <p>
                  Saved {report.summary.ok}, skipped {report.summary.skipped}, failed{" "}
                  {report.summary.failed}.
                  {report.summary.classesCreated
                    ? ` Created ${report.summary.classesCreated} scheduled class${report.summary.classesCreated === 1 ? "" : "es"}.`
                    : ""}
                </p>
                {failedRows.length > 0 ? (
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-destructive">
                    {failedRows.map((row) => (
                      <li key={row.clientRowId}>
                        {rowLabel(row.clientRowId)}: {row.error || "Failed"}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="relative z-10 shrink-0 border-t bg-background p-4 sm:p-6">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importing}
            className="min-h-[44px] touch-manipulation sm:min-h-9"
          >
            Close
          </Button>
          <Button
            onClick={() => void handleImport()}
            disabled={importing || !parsed || !date || !branchId}
            className="min-h-[44px] touch-manipulation sm:min-h-9"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {needsDateConfirm ? "Import anyway" : "Import now"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
