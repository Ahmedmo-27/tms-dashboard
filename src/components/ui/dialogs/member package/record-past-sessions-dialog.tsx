"use client";

import { useState, useTransition, useEffect } from "react";
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
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import { getPackages } from "@/lib/data/package";
import type { Package } from "@/components/ui/packages/columns";

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

interface SessionEntry {
  date: string;
  classId?: string;
  className?: string;
  scid?: string;
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

  const [catalogPackages, setCatalogPackages] = useState<Package[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<SessionEntry[]>([]);
  const [dateInput, setDateInput] = useState<string>(toLocalTodayString());
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isCancelled = false;
    getPackages()
      .then((pkgs) => {
        if (!isCancelled && Array.isArray(pkgs)) {
          setCatalogPackages(pkgs);
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, []);

  const currentCatalog = catalogPackages.find((cp) => cp._id === selectedPkg?._id);
  const packageHasClasses = Boolean(
    currentCatalog?.opensClasses && currentCatalog.opensClasses.length > 0
  );
  const openClasses = currentCatalog?.opensClasses || [];

  useEffect(() => {
    if (packageHasClasses && openClasses.length > 0) {
      setSelectedClassId(openClasses[0]._id);
    } else {
      setSelectedClassId("");
    }
  }, [selectedPkgKey, packageHasClasses, currentCatalog]);

  const resetForm = () => {
    setSelectedSessions([]);
    setDateInput(toLocalTodayString());
    setSelectedClassId("");
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

    const matchedClass = packageHasClasses
      ? openClasses.find((c) => c._id === selectedClassId) || openClasses[0]
      : undefined;

    const isDuplicate = selectedSessions.some((item) =>
      packageHasClasses
        ? item.date === dateInput && item.classId === matchedClass?._id
        : item.date === dateInput
    );
    if (isDuplicate) {
      setErrorMsg(
        packageHasClasses
          ? "This class on this date has already been added."
          : "This date has already been added."
      );
      return;
    }

    if (selectedSessions.length >= selectedPkg.remainingClasses) {
      setErrorMsg(
        `Cannot record more sessions than remaining classes (${selectedPkg.remainingClasses}).`
      );
      return;
    }

    const newEntry: SessionEntry = {
      date: dateInput,
      ...(matchedClass
        ? { classId: matchedClass._id, className: matchedClass.title }
        : {}),
    };
    setSelectedSessions((prev) =>
      [...prev, newEntry].sort((a, b) => a.date.localeCompare(b.date))
    );
    setDateInput("");
  };

  const handleRemoveSession = (indexToRemove: number) => {
    setSelectedSessions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedPkg) {
      setErrorMsg("Please select a package.");
      return;
    }

    if (selectedSessions.length === 0) {
      setErrorMsg("Please add at least one previous session date.");
      return;
    }

    if (selectedSessions.length > selectedPkg.remainingClasses) {
      setErrorMsg(
        `Cannot record ${selectedSessions.length} sessions. Only ${selectedPkg.remainingClasses} remaining.`
      );
      return;
    }

    const formData = new FormData();
    formData.append("uid", uid);
    formData.append("pkgId", selectedPkg._id);
    formData.append("pkgStartDate", selectedPkg.pkgStartDate);
    formData.append("previousSessionDates", JSON.stringify(selectedSessions));
    if (reason.trim()) {
      formData.append("reason", reason.trim());
    }

    startTransition(async () => {
      try {
        const res = await recordPreviousSessionsAction(null, formData);
        if (res.success) {
          toast.success(
            `Recorded ${selectedSessions.length} previous session${
              selectedSessions.length > 1 ? "s" : ""
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
    ? selectedPkg.remainingClasses - selectedSessions.length
    : 0;

  return (
    <>
      {trigger && (
        <span onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <span>Record Past Sessions</span>
            </DialogTitle>
            <DialogDescription>
              Record dates of sessions a member has already attended before their package was recorded at the front desk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
                      setSelectedSessions([]);
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

            {/* Session Date & Class Controls */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">Session Date</Label>
                  <PopoverDatePicker
                    className="w-full"
                    selectedDate={
                      dateInput ? new Date(dateInput + "T00:00:00") : undefined
                    }
                    handleDateChange={(dateStr) => {
                      if (!dateStr) {
                        setDateInput("");
                        return;
                      }
                      const d = new Date(dateStr);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      setDateInput(`${y}-${m}-${day}`);
                      setErrorMsg("");
                    }}
                    disabled={isPending || !selectedPkg}
                    disableFutureDates
                    hidePastWarning
                    placeholder="Pick past session date"
                  />
                </div>

                {packageHasClasses && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">Class Attended</Label>
                    <Select
                      value={selectedClassId}
                      onValueChange={setSelectedClassId}
                      disabled={isPending || !selectedPkg}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-[320px]">
                        {openClasses.map((cls) => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddDate}
                  disabled={
                    isPending ||
                    !selectedPkg ||
                    !dateInput ||
                    (packageHasClasses && !selectedClassId) ||
                    selectedSessions.length >= (selectedPkg?.remainingClasses ?? 0)
                  }
                  className="gap-1 h-9 px-3"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Session</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {packageHasClasses
                  ? "Pick a past date, choose which class was attended, and click \"Add Session\"."
                  : "Pick a past date and click \"Add Session\". The default scan will be recorded on the scans monitor."}
              </p>
            </div>

            {/* List of Added Sessions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  Sessions to Record ({selectedSessions.length})
                </Label>
                {selectedSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSessions([])}
                    className="text-xs text-destructive hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selectedSessions.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No previous sessions added yet. Add at least one above.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-md border bg-background">
                  {selectedSessions.map((session, idx) => {
                    let formatted = session.date;
                    try {
                      formatted = format(new Date(session.date + "T00:00:00"), "EEE, d MMM yyyy");
                    } catch {}
                    return (
                      <Badge
                        key={`${session.date}-${session.classId || idx}`}
                        variant="secondary"
                        className="gap-1 text-xs py-1 px-2.5 font-normal"
                      >
                        <Calendar className="h-3 w-3 opacity-70" />
                        <span>
                          {formatted}
                          {session.className ? ` · ${session.className}` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSession(idx)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          aria-label={`Remove session ${session.date}`}
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
            {selectedPkg && selectedSessions.length > 0 && (
              <div className="rounded-md bg-primary/5 border border-primary/20 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-foreground">Classes to deduct:</span>
                  <span className="font-semibold">{selectedSessions.length}</span>
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
                {packageHasClasses
                  ? "These sessions will be backdated under their chosen classes on the Scans Monitor without increasing today's scan count."
                  : "These sessions will record the default scan on the Scans Monitor for their historical dates without increasing today's scan count."}
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
                  selectedSessions.length === 0 ||
                  selectedSessions.length > (selectedPkg?.remainingClasses ?? 0)
                }
              >
                {isPending
                  ? "Saving..."
                  : `Record ${selectedSessions.length} Session${
                      selectedSessions.length === 1 ? "" : "s"
                    }`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
