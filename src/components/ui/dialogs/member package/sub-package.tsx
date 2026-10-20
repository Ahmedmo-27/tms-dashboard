"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../../checkbox";
import { subscribePackageAction } from "@/lib/actions/member-actions";
import {
  getPackageEndDateFromStart,
  isOpenGymPackage,
  sortPackagesWithOpenGymFirst,
} from "@/lib/utils/open-gym";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ManagementBranchField } from "@/components/ui/management-branch-field";
import { useManagementBranchSelection } from "@/lib/hooks/use-management-branch-selection";

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

  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [selectedPaymentDate, setSelectedPaymentDate] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");

  const [showEdits, setShowEdits] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);
  const [pendingDeduction, setPendingDeduction] = useState(false);

  interface PreviousSessionEntry {
    date: string;
    classId?: string;
    className?: string;
    scid?: string;
  }

  const [hasPreviousSessions, setHasPreviousSessions] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<PreviousSessionEntry[]>([]);
  const [dateToAdd, setDateToAdd] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const packageHasClasses = Boolean(pkg?.opensClasses && pkg.opensClasses.length > 0);
  const openClasses = pkg?.opensClasses || [];

  useEffect(() => {
    if (packageHasClasses && openClasses.length > 0) {
      setSelectedClassId(openClasses[0]._id);
    } else {
      setSelectedClassId("");
    }
  }, [pkg]);

  const handleAddPreviousDate = () => {
    if (!dateToAdd || !pkg) return;
    const today = toLocalTodayString();
    if (dateToAdd > today) {
      setDateError("Session date cannot be in the future");
      return;
    }

    const matchedClass = packageHasClasses
      ? openClasses.find((c) => c._id === selectedClassId) || openClasses[0]
      : undefined;

    const isDuplicate = previousSessions.some((item) =>
      packageHasClasses
        ? item.date === dateToAdd && item.classId === matchedClass?._id
        : item.date === dateToAdd
    );
    if (isDuplicate) {
      setDateError(
        packageHasClasses
          ? "This class on this date has already been added"
          : "Date already added"
      );
      return;
    }

    if (previousSessions.length >= Number(pkg.numberOfSessions)) {
      setDateError(`Cannot exceed package total sessions (${pkg.numberOfSessions})`);
      return;
    }

    const newEntry: PreviousSessionEntry = {
      date: dateToAdd,
      ...(matchedClass
        ? { classId: matchedClass._id, className: matchedClass.title }
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
    setPreviousSessions([]);
    setSelectedClassId("");
    setDateToAdd("");
    setDateError("");
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
        <DialogContent>
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
            <div className="space-y-3 mt-4 pt-2 border-t">
              <div className="flex gap-2 items-center">
                <Checkbox
                  id="previous-sessions-check"
                  checked={hasPreviousSessions}
                  onCheckedChange={(checked) => {
                    const val = Boolean(checked);
                    setHasPreviousSessions(val);
                    if (!val) {
                      setPreviousSessions([]);
    setSelectedClassId("");
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
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {packageHasClasses
                      ? "Record past sessions and choose which class was attended. Attendance will be recorded under that class on the scans monitor."
                      : "Record dates of past sessions already taken. The default scan will be recorded on the scans monitor for the chosen dates."}
                  </p>

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Session Date</Label>
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

                      {packageHasClasses && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Class Attended</Label>
                          <Select
                            value={selectedClassId}
                            onValueChange={setSelectedClassId}
                            disabled={pending || !pkg}
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
                        size="sm"
                        variant="outline"
                        onClick={handleAddPreviousDate}
                        disabled={pending || !pkg || !dateToAdd || (packageHasClasses && !selectedClassId)}
                        className="gap-1 h-9 px-3"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Session</span>
                      </Button>
                    </div>
                  </div>

                  {dateError && (
                    <p className="text-xs text-destructive">{dateError}</p>
                  )}

                  {previousSessions.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-md border bg-background">
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

                      {pkg && (
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-muted-foreground">
                            Sessions deducted: <strong>{previousSessions.length}</strong>
                          </span>
                          <span className="text-foreground">
                            Remaining sessions:{" "}
                            <strong>
                              {Math.max(
                                0,
                                Number(pkg.numberOfSessions) - previousSessions.length
                              )}
                            </strong>{" "}
                            of {pkg.numberOfSessions}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No dates added yet. Pick a past date {packageHasClasses ? "and class " : ""}and click &quot;Add Session&quot;.
                    </p>
                  )}
                </div>
              )}
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
              <Button type="submit" disabled={pending || !hasLocationId}>
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
