"use client";

import { useEffect, useState, useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package } from "@/components/ui/packages/columns";
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PackageSearchSelect } from "@/components/ui/package-search-select";
import { ClassSearchSelect } from "@/components/ui/class-search-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../../checkbox";
import { subscribePackageAction } from "@/lib/actions/member-actions";
import {
  getPackageEndDateFromStart,
  isOpenGymPackage,
  sortPackagesWithOpenGymFirst,
} from "@/lib/utils/open-gym";
import { Plus, X, AlertTriangle, Info } from "lucide-react";
import { getOwedPtSessions, type OwedPtSession } from "@/lib/data/pt";
import { PtSettleDialog } from "@/components/ui/dialogs/pt/pt-settle-dialog";
import { Badge } from "@/components/ui/badge";
import { ManagementBranchField } from "@/components/ui/management-branch-field";
import { useManagementBranchSelection } from "@/lib/hooks/use-management-branch-selection";
import {
  getOwedSessionCoachName,
  groupOwedSessionsByCoach,
} from "@/lib/utils/owed-pt-sessions";
import { useSalesAccounts } from "@/lib/hooks/use-sales-accounts";

/** Sentinel for "no salesperson" — Select cannot hold an empty value. */
const NO_SALES_ACCOUNT = "__none__";

function toLocalTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const paymentMethods = [
  { value: "VISA", header: "Visa" },
  { value: "VALU", header: "Valu" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "CASH", header: "Cash" },
];

interface SubPackageProps {
  packages: Package[];
  uid: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function SubPackage({
  packages,
  uid,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: SubPackageProps) {
  const {
    locationId,
    setModalLocationId,
    needsBranchSelection,
    hasLocationId,
    resetModalBranch,
  } = useManagementBranchSelection();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const [pkg, setPkg] = useState<Package | null>(null);
  const { accounts: salesAccounts, isLoading: salesAccountsLoading } =
    useSalesAccounts(open);

  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [selectedPaymentDate, setSelectedPaymentDate] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");

  const [showEdits, setShowEdits] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);
  const [pendingDeduction, setPendingDeduction] = useState(false);
  const [soldBy, setSoldBy] = useState(NO_SALES_ACCOUNT);

  interface PreviousSessionEntry {
    date: string;
    classId?: string;
    className?: string;
    scid?: string;
    isOpenGym?: boolean;
  }

  const [hasPreviousSessions, setHasPreviousSessions] = useState(false);
  const [pastSessionsModalOpen, setPastSessionsModalOpen] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<PreviousSessionEntry[]>([]);
  const [dateToAdd, setDateToAdd] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const [owedPtSessions, setOwedPtSessions] = useState<OwedPtSession[]>([]);

  const fetchOwedSessions = () => {
    if (!uid) return;
    getOwedPtSessions(undefined, uid)
      .then((list) => setOwedPtSessions(list.filter((s) => s.status === "PENDING")))
      .catch(() => setOwedPtSessions([]));
  };

  useEffect(() => {
    if (open && uid) {
      fetchOwedSessions();
    } else {
      setOwedPtSessions([]);
    }
  }, [open, uid]);

  const extractCoachId = (coach: any): string | null => {
    if (!coach) return null;
    if (typeof coach === "string") return coach.trim();
    if (typeof coach === "object") {
      if (coach._id) return String(coach._id).trim();
      if (coach.id) return String(coach.id).trim();
    }
    return String(coach).trim();
  };

  const selectedPkgCoachId = extractCoachId(pkg?.coachId);

  const sameCoachDebt = pkg && selectedPkgCoachId
    ? owedPtSessions.filter((s) => {
        const sCoachId = extractCoachId(s.coachId);
        return Boolean(sCoachId && sCoachId === selectedPkgCoachId);
      })
    : [];

  const otherCoachDebt = pkg
    ? owedPtSessions.filter((s) => {
        const sCoachId = extractCoachId(s.coachId);
        return !selectedPkgCoachId || !sCoachId || sCoachId !== selectedPkgCoachId;
      })
    : [];

  const packageHasClasses = Boolean(pkg?.opensClasses && pkg.opensClasses.length > 0);
  const openClasses = pkg?.opensClasses || [];

  const isPtPackage =
    pkg?.category === "PERSONAL_TRAINING" || Boolean(pkg?.coachId);

  const packageSupportsOpenGym = Boolean(
    (pkg?.category && isOpenGymPackage(pkg.category)) ||
    pkg?.name?.toLowerCase().includes("ultimate") ||
    pkg?.name?.toLowerCase().includes("open gym") ||
    pkg?.name?.toLowerCase().includes("space") ||
    (!packageHasClasses && !isPtPackage)
  );

  const OPEN_GYM_OPTION = { _id: "OPEN_GYM", title: "Open Gym" };

  const selectableActivities: { _id: string; title: string }[] = [
    ...(packageSupportsOpenGym ? [OPEN_GYM_OPTION] : []),
    ...openClasses,
  ];

  const hasActivityChoice = selectableActivities.length > 0;

  useEffect(() => {
    if (selectableActivities.length > 0) {
      if (selectedClassId && selectableActivities.some((a) => a._id === selectedClassId)) {
        return;
      }
      if (openClasses.length > 0) {
        setSelectedClassId(openClasses[0]._id);
      } else {
        setSelectedClassId(selectableActivities[0]._id);
      }
    } else {
      setSelectedClassId("");
    }
  }, [pkg, selectableActivities.length]);

  const handleAddPreviousDate = () => {
    if (!dateToAdd || !pkg) return;
    const today = toLocalTodayString();
    if (dateToAdd > today) {
      setDateError("Session date cannot be in the future");
      return;
    }

    const matchedActivity = selectableActivities.find((c) => c._id === selectedClassId);

    const isDuplicate = previousSessions.some((item) =>
      matchedActivity
        ? item.date === dateToAdd && item.classId === matchedActivity._id
        : item.date === dateToAdd
    );
    if (isDuplicate) {
      setDateError(
        matchedActivity
          ? `This activity (${matchedActivity.title}) on this date has already been added`
          : "Date already added"
      );
      return;
    }

    if (previousSessions.length >= Number(pkg.numberOfSessions)) {
      setDateError(`Cannot exceed package total sessions (${pkg.numberOfSessions})`);
      return;
    }

    const isOg =
      matchedActivity?._id === "OPEN_GYM" ||
      (!packageHasClasses && packageSupportsOpenGym);

    const newEntry: PreviousSessionEntry = {
      date: dateToAdd,
      ...(matchedActivity
        ? {
            classId: matchedActivity._id,
            className: matchedActivity.title,
            isOpenGym: isOg,
          }
        : isOg
        ? {
            classId: "OPEN_GYM",
            className: "Open Gym",
            isOpenGym: true,
          }
        : {}),
    };
    setPreviousSessions((prev) =>
      [...prev, newEntry].sort((a, b) => a.date.localeCompare(b.date))
    );
    setDateToAdd("");
    setDateError("");
  };

  const handleRemovePreviousSession = (indexToRemove: number) => {
    setPreviousSessions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setDateError("");
  };

  // Reset state when modal opens
  const resetForm = () => {
    setPkg(null);
    setSelectedStartDate("");
    setSelectedEndDate("");
    setSelectedPaymentDate("");
    setSelectedAmount("");
    setSelectedPaymentMethod("CASH");
    setShowEdits(false);
    setPriceChanged(false);
    setPendingDeduction(false);
    setHasPreviousSessions(false);
    setPastSessionsModalOpen(false);
    setPreviousSessions([]);
    setSelectedClassId("");
    setDateToAdd("");
    setDateError("");
    setSoldBy(NO_SALES_ACCOUNT);
  };

  const toggleOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
    if (value) resetModalBranch();
    if (!value) resetForm();
  };

  const handleStartDate = (date: string) => {
    if (!pkg) return;

    setSelectedStartDate(date);
    setSelectedEndDate(getPackageEndDateFromStart(date, pkg));
  };

  useEffect(() => {
    if (!pkg) return;
    setSelectedAmount(pkg.price.toString());
  }, [pkg]);

  useEffect(() => {
    setPriceChanged(selectedAmount !== String(pkg?.price ?? ""));
  }, [selectedAmount, pkg]);

  const initialState = { success: false, errors: null, data: null };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      try {
        const result = await subscribePackageAction(currentState, formData);

        if (result.success) {
          toggleOpen(false);
          return initialState;
        }

        return {
          ...result,
        };
      } catch (error) {
        throw error;
      }
    },
    initialState
  );

  const sortedPackages = sortPackagesWithOpenGymFirst(packages);

  return (
    <>
      {!hideTrigger && (
        <Button variant="outline" size="sm" onClick={() => toggleOpen(true)}>
          Add Package
        </Button>
      )}

      <Dialog open={open} onOpenChange={toggleOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {pkg && isOpenGymPackage(pkg.category)
                ? "Add open gym package"
                : "Subscribe to a package"}
            </DialogTitle>
            <DialogDescription>
              {pkg && isOpenGymPackage(pkg.category)
                ? "Weekly or monthly open gym access for this member."
                : "Select the package details below."}
            </DialogDescription>
          </DialogHeader>

          <form action={formAction}>
            {/* Hidden fields */}
            <input type="hidden" name="uid" value={uid} />
            <input type="hidden" name="pkgId" value={pkg?._id ?? ""} />
            <input type="hidden" name="startDate" value={selectedStartDate} />
            <input type="hidden" name="endDate" value={selectedEndDate} />
            <input type="hidden" name="paymentDate" value={selectedPaymentDate} />
            <input type="hidden" name="amount" value={selectedAmount} />
            <input type="hidden" name="paymentMethod" value={selectedPaymentMethod} />
            <input type="hidden" name="priceChanged" value={String(priceChanged)} />
            <input type="hidden" name="pendingDeduction" value={pendingDeduction.toString()} />
            <input
              type="hidden"
              name="previousSessionDates"
              value={JSON.stringify(previousSessions)}
            />
            <input
              type="hidden"
              name="soldBy"
              value={soldBy === NO_SALES_ACCOUNT ? "" : soldBy}
            />

            <div className="space-y-2 mt-4">
              <ManagementBranchField
                locationId={locationId}
                onLocationChange={setModalLocationId}
                needsBranchSelection={needsBranchSelection}
                disabled={pending}
              />
            </div>

            {state?.errors && "message" in state.errors && state.errors.message && (
              <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {state.errors.message}
              </div>
            )}

            {/* Package */}
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium">Package</Label>
              <PackageSearchSelect
                packages={sortedPackages}
                value={pkg}
                onChange={setPkg}
                disabled={pending}
              />
            </div>

            {/* Owed PT Debt Notices */}
            {otherCoachDebt.length > 0 && (
              <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-semibold">Unpaid PT Session Alert: </span>
                    This member has {otherCoachDebt.length} unpaid session(s) with Coach{" "}
                    {Array.from(new Set(otherCoachDebt.map(getOwedSessionCoachName))).join(", ")}.
                    You must settle these sessions before subscribing to this package.
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {groupOwedSessionsByCoach(otherCoachDebt).map((group) => (
                    <PtSettleDialog
                      key={group.coachKey}
                      sessions={group.sessions.map((s) => ({
                        sessionId: s._id,
                        amount: s.amount,
                        attendanceDate: s.attendanceDate,
                      }))}
                      clientName={group.sessions[0]?.clientName}
                      phoneNumber={group.sessions[0]?.phoneNumber}
                      coachName={group.coachName}
                      coachId={group.coachId}
                      initialAmount={group.sessions.reduce(
                        (total, s) => total + (Number(s.amount) || 0),
                        0
                      )}
                      uid={uid}
                      onSuccess={fetchOwedSessions}
                    />
                  ))}
                </div>
              </div>
            )}

            {sameCoachDebt.length > 0 && otherCoachDebt.length === 0 && (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <span className="font-semibold">Auto-Deduction Notice: </span>
                  This member has {sameCoachDebt.length} unpaid session(s) with Coach{" "}
                  {getOwedSessionCoachName(sameCoachDebt[0])}.
                  {" "}
                  {sameCoachDebt.length === 1 ? "1 session" : `${sameCoachDebt.length} sessions`} will automatically be deducted from this new package upon purchase.
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <PopoverDatePicker
                  className="w-full"
                  selectedDate={selectedStartDate ? new Date(selectedStartDate) : undefined}
                  handleDateChange={handleStartDate}
                  disabled={!pkg}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date</Label>
                <PopoverDatePicker
                  className="w-full"
                  selectedDate={selectedEndDate ? new Date(selectedEndDate) : undefined}
                  disabled
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium">Payment Method</Label>
              <Select
                value={selectedPaymentMethod}
                disabled={!selectedStartDate || pending}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Previous Sessions (already attended) */}
            <div className="space-y-2 mt-4 pt-2 border-t">
              <div className="flex gap-2 items-center">
                <Checkbox
                  id="previous-sessions-check"
                  checked={hasPreviousSessions}
                  onCheckedChange={(checked) => {
                    const val = Boolean(checked);
                    setHasPreviousSessions(val);
                    if (val) {
                      setPastSessionsModalOpen(true);
                    } else {
                      setPreviousSessions([]);
                      setSelectedClassId("");
                      setDateToAdd("");
                      setDateError("");
                    }
                  }}
                  disabled={pending || !pkg}
                />
                <label
                  htmlFor="previous-sessions-check"
                  className="text-sm font-medium cursor-pointer"
                >
                  Member has already attended sessions with this package
                </label>
              </div>

              {hasPreviousSessions && (
                <div className="rounded-lg border bg-muted/20 p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs">
                      {previousSessions.length > 0 ? (
                        <span>
                          <strong>{previousSessions.length}</strong> past session{previousSessions.length > 1 ? "s" : ""} recorded
                          {pkg ? (
                            <span className="text-muted-foreground">
                              {" "}· {Math.max(0, Number(pkg.numberOfSessions) - previousSessions.length)} remaining
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No past sessions added yet
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setPastSessionsModalOpen(true)}
                    >
                      {previousSessions.length > 0 ? "Edit Dates" : "Add Dates"}
                    </Button>
                  </div>

                  {previousSessions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {previousSessions.map((session, idx) => (
                        <Badge
                          key={`${session.date}-${session.classId || idx}`}
                          variant="secondary"
                          className="gap-1 text-xs py-0.5 px-2 font-normal"
                        >
                          <span>
                            {session.date}
                            {session.className ? ` · ${session.className}` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePreviousSession(idx)}
                            className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label={`Remove session ${session.date}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sales attribution — optional here, editable later from the sales dashboard */}
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium">Sold by (salesperson)</Label>
              <Select
                value={soldBy}
                disabled={pending || salesAccountsLoading}
                onValueChange={setSoldBy}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      salesAccountsLoading
                        ? "Loading sales accounts..."
                        : "No salesperson"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SALES_ACCOUNT}>No salesperson</SelectItem>
                  {salesAccounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.name}
                      {account.role === "sales_manager" ? " (Sales Manager)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Edit payment details */}
            <div className="flex gap-2 items-center mt-4">
              <Checkbox
                name="showEdits"
                checked={showEdits}
                onCheckedChange={() => setShowEdits((prev) => !prev)}
              />
              <p onClick={() => setShowEdits((prev) => !prev)} className="cursor-pointer">
                Edit payment date or amount
              </p>
            </div>

            {showEdits && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Paid Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    className="w-full mt-1"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    disabled={!pkg}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Payment Date</Label>
                  <PopoverDatePicker
                    selectedDate={
                      selectedPaymentDate ? new Date(selectedPaymentDate) : undefined
                    }
                    handleDateChange={setSelectedPaymentDate}
                    className="w-full mt-1"
                    disabled={!pkg}
                  />
                </div>
              </div>
            )}

            {state?.errors &&
              typeof state.errors === "object" &&
              "message" in state.errors &&
              (state.errors as { message?: string }).message && (
                <p className="text-destructive text-sm mt-4">
                  {(state.errors as { message?: string }).message}
                </p>
              )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => toggleOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending || !hasLocationId || otherCoachDebt.length > 0}
              >
                {otherCoachDebt.length > 0 ? "Settle Unpaid PT First" : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Past Sessions Sub-Modal */}
      <Dialog open={pastSessionsModalOpen} onOpenChange={setPastSessionsModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Past Sessions</DialogTitle>
            <DialogDescription>
              {packageHasClasses
                ? "Record past sessions and choose which class was attended. Attendance will be recorded under that class on the scans monitor."
                : "Record dates of past sessions already taken. The default scan will be recorded on the scans monitor for the chosen dates."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Session Date
                  </Label>
                  <PopoverDatePicker
                    className="w-full"
                    selectedDate={
                      dateToAdd ? new Date(dateToAdd + "T00:00:00") : undefined
                    }
                    handleDateChange={(dateStr) => {
                      if (!dateStr) {
                        setDateToAdd("");
                        return;
                      }
                      const d = new Date(dateStr);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      setDateToAdd(`${y}-${m}-${day}`);
                      setDateError("");
                    }}
                    disabled={pending || !pkg}
                    disableFutureDates
                    hidePastWarning
                    placeholder="Pick past session date"
                  />
                </div>

                {hasActivityChoice && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {packageHasClasses && packageSupportsOpenGym
                        ? "Class or Open Gym"
                        : packageHasClasses
                        ? "Class Attended"
                        : "Activity Attended"}
                    </Label>
                    <ClassSearchSelect
                      classes={selectableActivities}
                      value={selectedClassId}
                      onChange={setSelectedClassId}
                      disabled={pending || !pkg}
                      placeholder={
                        packageSupportsOpenGym
                          ? "Select class or Open Gym"
                          : "Select class"
                      }
                      searchPlaceholder="Search class or Open Gym..."
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddPreviousDate}
                  disabled={
                    pending ||
                    !pkg ||
                    !dateToAdd ||
                    (hasActivityChoice && !selectedClassId)
                  }
                  className="gap-1 h-9 px-3"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Session</span>
                </Button>
              </div>

              {dateError && (
                <p className="text-xs text-destructive">{dateError}</p>
              )}
            </div>

            {previousSessions.length > 0 ? (
              <div className="space-y-2 rounded-md border p-3 bg-muted/10">
                <div className="flex items-center justify-between text-xs pb-1 border-b">
                  <span className="font-medium text-foreground">
                    Recorded Sessions ({previousSessions.length})
                  </span>
                  {pkg && (
                    <span className="text-muted-foreground">
                      Remaining:{" "}
                      <strong>
                        {Math.max(
                          0,
                          Number(pkg.numberOfSessions) - previousSessions.length
                        )}
                      </strong>{" "}
                      of {pkg.numberOfSessions}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {previousSessions.map((session, idx) => (
                    <Badge
                      key={`${session.date}-${session.classId || idx}`}
                      variant="secondary"
                      className="gap-1 text-xs py-0.5 px-2 font-normal"
                    >
                      <span>
                        {session.date}
                        {session.className ? ` · ${session.className}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePreviousSession(idx)}
                        className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={`Remove session ${session.date}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                No dates added yet. Pick a past date {packageHasClasses ? "and class " : ""}and click &quot;Add Session&quot;.
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setPastSessionsModalOpen(false)}
              >
                Done ({previousSessions.length} session{previousSessions.length === 1 ? "" : "s"})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
