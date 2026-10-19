"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Calendar, Plus, X, History, AlertCircle, Info } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberPackage } from "@/components/ui/members/columns";
import { recordPreviousSessionsAction } from "@/lib/actions/member-actions";

function toLocalTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface RecordPastSessionsDialogProps {
  uid: string;
  packages: MemberPackage[];
  defaultPkg?: MemberPackage | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function RecordPastSessionsDialog({
  uid,
  packages,
  defaultPkg,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: RecordPastSessionsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
    if (!value) {
      resetForm();
    }
  };

  const eligiblePackages = packages.filter(
    (p) => p.status?.toUpperCase() !== "DELETED" && p.remainingClasses > 0
  );

  const [selectedPkgKey, setSelectedPkgKey] = useState<string>(() => {
    if (defaultPkg) return `${defaultPkg._id}-${defaultPkg.pkgStartDate}`;
    return eligiblePackages[0]
      ? `${eligiblePackages[0]._id}-${eligiblePackages[0].pkgStartDate}`
      : "";
  });

  const selectedPkg =
    (defaultPkg && `${defaultPkg._id}-${defaultPkg.pkgStartDate}` === selectedPkgKey
      ? defaultPkg
      : packages.find((p) => `${p._id}-${p.pkgStartDate}` === selectedPkgKey)) ||
    defaultPkg ||
    eligiblePackages[0] ||
    null;

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState<string>(toLocalTodayString());
  const [reason, setReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setSelectedDates([]);
    setDateInput(toLocalTodayString());
    setReason("");
    setErrorMsg("");
  };

  const handleAddDate = () => {
    setErrorMsg("");
    if (!dateInput) return;

    if (!selectedPkg) {
      setErrorMsg("Please select a package first.");
      return;
    }

    const todayStr = toLocalTodayString();
    if (dateInput > todayStr) {
      setErrorMsg("Session date cannot be in the future.");
      return;
    }

    if (selectedDates.includes(dateInput)) {
      setErrorMsg("This date has already been added.");
      return;
    }

    if (selectedDates.length >= selectedPkg.remainingClasses) {
      setErrorMsg(
        `Cannot record more sessions than remaining classes (${selectedPkg.remainingClasses}).`
      );
      return;
    }

    setSelectedDates((prev) => [...prev, dateInput].sort());
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setSelectedDates((prev) => prev.filter((d) => d !== dateToRemove));
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedPkg) {
      setErrorMsg("Please select a package.");
      return;
    }

    if (selectedDates.length === 0) {
      setErrorMsg("Please add at least one previous session date.");
      return;
    }

    if (selectedDates.length > selectedPkg.remainingClasses) {
      setErrorMsg(
        `Cannot record ${selectedDates.length} sessions. Only ${selectedPkg.remainingClasses} remaining.`
      );
      return;
    }

    const formData = new FormData();
    formData.append("uid", uid);
    formData.append("pkgId", selectedPkg._id);
    formData.append("pkgStartDate", selectedPkg.pkgStartDate);
    formData.append("previousSessionDates", JSON.stringify(selectedDates));
    if (reason.trim()) {
      formData.append("reason", reason.trim());
    }

    startTransition(async () => {
      try {
        const res = await recordPreviousSessionsAction(null, formData);
        if (res.success) {
          toast.success(
            `Recorded ${selectedDates.length} previous session${
              selectedDates.length > 1 ? "s" : ""
            } successfully!`
          );
          setOpen(false);
        } else {
          const msg =
            (res.errors as any)?.message ||
            "Failed to record previous sessions.";
          setErrorMsg(msg);
          toast.error(msg);
        }
      } catch (err: any) {
        const msg = err?.message || "Failed to record previous sessions.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    });
  };

  const remainingAfter = selectedPkg
    ? selectedPkg.remainingClasses - selectedDates.length
    : 0;

  return (
    <>
      {trigger && (
        <span onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <span>Record Past Sessions</span>
            </DialogTitle>
            <DialogDescription>
              Record previous sessions attended by this member before package registration.
              These will be logged under their actual dates without affecting today&apos;s scans monitor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Package Selection */}
            {!defaultPkg && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Select Package</Label>
                {eligiblePackages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No active packages with remaining classes available.
                  </p>
                ) : (
                  <Select
                    value={selectedPkgKey}
                    onValueChange={(val) => {
                      setSelectedPkgKey(val);
                      setSelectedDates([]);
                      setErrorMsg("");
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligiblePackages.map((p) => (
                        <SelectItem
                          key={`${p._id}-${p.pkgStartDate}`}
                          value={`${p._id}-${p.pkgStartDate}`}
                        >
                          {p.name} ({p.remainingClasses} left)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {selectedPkg && (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate max-w-[220px]">
                    {selectedPkg.name}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {selectedPkg.remainingClasses} classes left
                  </Badge>
                </div>
                {selectedPkg.pkgStartDate && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Package started:{" "}
                      {format(new Date(selectedPkg.pkgStartDate), "dd MMM yyyy")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Date Input Stepper */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Add Previous Session Date
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateInput}
                  max={toLocalTodayString()}
                  onChange={(e) => setDateInput(e.target.value)}
                  disabled={isPending || !selectedPkg}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDate();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddDate}
                  disabled={
                    isPending ||
                    !selectedPkg ||
                    !dateInput ||
                    selectedDates.length >= (selectedPkg?.remainingClasses ?? 0)
                  }
                  className="gap-1 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Date</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pick a past date and click &quot;Add Date&quot;. You can add multiple dates.
              </p>
            </div>

            {/* List of Added Dates */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  Sessions to Record ({selectedDates.length})
                </Label>
                {selectedDates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDates([])}
                    className="text-xs text-destructive hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selectedDates.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No previous session dates added yet. Add at least one above.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-md border bg-background">
                  {selectedDates.map((dateStr) => {
                    let formatted = dateStr;
                    try {
                      formatted = format(new Date(dateStr + "T00:00:00"), "EEE, d MMM yyyy");
                    } catch {}
                    return (
                      <Badge
                        key={dateStr}
                        variant="secondary"
                        className="gap-1 text-xs py-1 px-2.5 font-normal"
                      >
                        <Calendar className="h-3 w-3 opacity-70" />
                        <span>{formatted}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(dateStr)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          aria-label={`Remove ${dateStr}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live calculation banner */}
            {selectedPkg && selectedDates.length > 0 && (
              <div className="rounded-md bg-primary/5 border border-primary/20 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-foreground">Classes to deduct:</span>
                  <span className="font-semibold">{selectedDates.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Classes left after save:</span>
                  <span
                    className={`font-semibold ${
                      remainingAfter === 0 ? "text-amber-600 font-bold" : "text-primary"
                    }`}
                  >
                    {remainingAfter} {remainingAfter === 0 && "(Package will complete)"}
                  </span>
                </div>
              </div>
            )}

            {/* Optional Reason / Notes */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Notes (Optional)</Label>
              <Input
                placeholder="Reason or notes (e.g. Attended prior to package detection)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
              />
            </div>

            {/* Info notice about scans monitor */}
            <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 p-2.5 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                These sessions are backdated to their respective historical dates. They will{" "}
                <strong>not</strong> increase today&apos;s scan count on the Scans Monitor.
              </span>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-destructive rounded-md bg-destructive/10 p-2 border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isPending ||
                  !selectedPkg ||
                  selectedDates.length === 0 ||
                  selectedDates.length > (selectedPkg?.remainingClasses ?? 0)
                }
              >
                {isPending
                  ? "Saving..."
                  : `Record ${selectedDates.length} Session${
                      selectedDates.length === 1 ? "" : "s"
                    }`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
