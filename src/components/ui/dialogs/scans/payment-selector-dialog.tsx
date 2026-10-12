"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useActionState } from "react";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/core/api-error";
import { recordNonUserBookingPaymentAction } from "@/lib/actions/booking-actions";
import { ManagementBranchField } from "@/components/ui/management-branch-field";
import { useManagementBranchSelection } from "@/lib/hooks/use-management-branch-selection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import { Input } from "@/components/ui/input";
import { getMembers } from "@/lib/data/member";
import { getPackages } from "@/lib/data/package";
import { packageOpensClass } from "@/lib/utils/package-eligibility";
import type { Package } from "@/components/ui/packages/columns";
import type { Member, MemberPackage } from "@/components/ui/members/columns";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: unknown | null;
  defaultValues?: {
    bookingId: string;
    paymentMethod: "CASH" | "VISA" | "VALU" | "INSTAPAY" | "DEDUCTED" | "FOC" | "";
  };
}

const paymentMethods = [
  { value: "VISA", header: "Visa" },
  { value: "VALU", header: "Valu" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "CASH", header: "Cash" },
  { value: "DEDUCTED", header: "Deducted from a new package" },
  { value: "FOC", header: "FOC (Invitation / Complimentary)" },
];

export function PaymentSelectorDialog({
  bookingId,
  initialPhone = "",
  scid,
  targetCid,
  className,
  onSuccess,
}: {
  bookingId: string;
  initialPhone?: string;
  scid?: string;
  targetCid?: string;
  className?: string;
  onSuccess?: () => void;
}) {
  const {
    locationId,
    setModalLocationId,
    needsBranchSelection,
    hasLocationId,
    resetModalBranch,
  } = useManagementBranchSelection();

  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: { bookingId: "", paymentMethod: "CASH" },
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");

  // Deducted package matching state
  const [phone, setPhone] = useState(initialPhone || "");
  const [catalogPackages, setCatalogPackages] = useState<Package[]>([]);
  const [matchedMember, setMatchedMember] = useState<Member | null>(null);
  const [eligiblePackages, setEligiblePackages] = useState<MemberPackage[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>("");
  const [isSearchingMember, setIsSearchingMember] = useState(false);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "searching" | "found" | "not_found" | "no_packages"
  >("idle");
  const [searchMessage, setSearchMessage] = useState<string>("");

  const handleDateChange = (date: string) => {
    setPaymentDate(date);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsLoading(false);
    }
  };

  // Lookup member and verify package eligibility when DEDUCTED is chosen
  useEffect(() => {
    if (!isOpen || selectedPaymentMethod !== "DEDUCTED") return;

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 4) {
      setMatchedMember(null);
      setEligiblePackages([]);
      setSelectedPkgId("");
      setSearchStatus("idle");
      setSearchMessage("");
      return;
    }

    let isCancelled = false;
    setSearchStatus("searching");
    setIsSearchingMember(true);

    const timer = setTimeout(async () => {
      try {
        let pkgs = catalogPackages;
        if (pkgs.length === 0) {
          try {
            pkgs = await getPackages();
            if (!isCancelled) setCatalogPackages(pkgs);
          } catch (e) {
            console.error("Failed to load catalog packages", e);
          }
        }

        const res = await getMembers(trimmedPhone, 1, 5);
        if (isCancelled) return;

        const membersList = res?.data || [];
        if (membersList.length === 0) {
          setMatchedMember(null);
          setEligiblePackages([]);
          setSelectedPkgId("");
          setSearchStatus("not_found");
          setSearchMessage(`No member found with phone number "${trimmedPhone}".`);
          return;
        }

        const cleanQuery = trimmedPhone.replace(/\D/g, "");
        const found =
          membersList.find((m) => {
            const cleanM = (m.phone || "").replace(/\D/g, "");
            return cleanM === cleanQuery || cleanM.endsWith(cleanQuery) || cleanQuery.endsWith(cleanM);
          }) || membersList[0];

        setMatchedMember(found);

        // Filter packages that are active, have remaining classes, and open this class
        const eligible = (found.packages || []).filter((p) => {
          if (p.status !== "ACTIVE" && p.status !== undefined) return false;
          if (typeof p.remainingClasses === "number" && p.remainingClasses <= 0) return false;
          if (targetCid && pkgs.length > 0) {
            const catPkg = pkgs.find((cp) => cp._id === p._id || cp.name === p.name);
            if (catPkg && !packageOpensClass(catPkg, targetCid)) {
              return false;
            }
          }
          return true;
        });

        if (eligible.length === 0) {
          setEligiblePackages([]);
          setSelectedPkgId("");
          setSearchStatus("no_packages");
          setSearchMessage(
            `Member found (${found.name}), but has no active package eligible for ${className || "this class"} with remaining sessions.`
          );
        } else {
          setEligiblePackages(eligible);
          setSelectedPkgId((prev) => (eligible.some((e) => e._id === prev) ? prev : eligible[0]._id));
          setSearchStatus("found");
          setSearchMessage("");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Member lookup error", err);
          setSearchStatus("not_found");
          setSearchMessage("Failed to lookup member by phone number.");
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingMember(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, selectedPaymentMethod, phone, targetCid, catalogPackages, className]);

  const [state, formAction, pending] = useActionState(
    async (currentState: ActionState, formData: FormData) => {
      setIsLoading(true);

      const defaultValues = {
        bookingId: formData.get("bookingId") as string,
        paymentMethod: formData.get("paymentMethod") as ActionState["defaultValues"] extends infer D
          ? D extends { paymentMethod: infer P }
            ? P
            : ""
          : "",
      };

      try {
        const result = await recordNonUserBookingPaymentAction(
          currentState,
          formData
        );

        if (result.success) {
          setIsOpen(false);
          onSuccess?.();
          return initialState;
        }
        return { ...result, defaultValues } as ActionState;
      } finally {
        setIsLoading(false);
      }
    },
    initialState
  );

  const fieldErrors =
    state?.errors && typeof state.errors === "object"
      ? (state.errors as Record<string, string | boolean>)
      : null;

  const isDeductedInvalid =
    selectedPaymentMethod === "DEDUCTED" &&
    (searchStatus !== "found" || !matchedMember || !selectedPkgId);

  const canSubmit =
    !pending && !isLoading && hasLocationId && !isDeductedInvalid;

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="font-normal h-auto py-0.5 px-2 border-yellow-500 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
          onClick={() => {
            resetModalBranch();
            setPhone(initialPhone || "");
            setSelectedPaymentMethod("CASH");
            setMatchedMember(null);
            setEligiblePackages([]);
            setSelectedPkgId("");
            setSearchStatus("idle");
            setSearchMessage("");
            setIsOpen(true);
          }}
        >
          Will Pay
        </Button>

        <DialogContent className="z-50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Confirm Guest Attendance
            </DialogTitle>
            <DialogDescription>
              Choose payment method to confirm attendance
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="mt-4 space-y-6">
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="paymentMethod" value={selectedPaymentMethod} />
            <ManagementBranchField
              locationId={locationId}
              onLocationChange={setModalLocationId}
              needsBranchSelection={needsBranchSelection}
              disabled={pending || isLoading}
            />

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Method</Label>
                <Select
                  value={selectedPaymentMethod}
                  onValueChange={(value) => setSelectedPaymentMethod(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem
                        key={method.value}
                        value={method.value}
                        className="hover:bg-accent flex flex-row justify-between"
                      >
                        <div>{method.header}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {fieldErrors && typeof fieldErrors.paymentMethod === "string" && (
                <p className="text-destructive text-xs">
                  {fieldErrors.paymentMethod}
                </p>
              )}

              {selectedPaymentMethod === "FOC" ? (
                <div className="rounded-md border border-indigo-200 bg-indigo-50/50 p-3 text-xs text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-300">
                  This walk-in will be marked as Free of Charge (FOC / Invitation). No payment will be collected or recorded.
                </div>
              ) : selectedPaymentMethod === "DEDUCTED" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="deductedPhone" className="text-sm font-medium">
                      Member Phone Number
                    </Label>
                    <Input
                      id="deductedPhone"
                      name="phoneNumber"
                      type="tel"
                      placeholder="e.g., 01012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  {isSearchingMember || searchStatus === "searching" ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Checking member and package eligibility...</span>
                    </div>
                  ) : null}

                  {searchStatus === "not_found" ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">No Member Found</p>
                        <p>{searchMessage}</p>
                      </div>
                    </div>
                  ) : null}

                  {searchStatus === "no_packages" ? (
                    <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">No Eligible Package</p>
                        <p>{searchMessage}</p>
                      </div>
                    </div>
                  ) : null}

                  {searchStatus === "found" && matchedMember ? (
                    <div className="rounded-md border border-green-200 bg-green-50/60 dark:border-green-900/40 dark:bg-green-950/20 p-3 space-y-3">
                      <div className="flex items-center justify-between text-xs text-green-800 dark:text-green-300">
                        <div className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span>{matchedMember.name}</span>
                        </div>
                        <span className="text-muted-foreground">{matchedMember.phone}</span>
                      </div>

                      {eligiblePackages.length === 1 ? (
                        <div className="rounded border bg-background/80 p-2.5 text-xs">
                          <div className="text-muted-foreground text-[11px] uppercase tracking-wide font-semibold mb-0.5">
                            Deducting 1 session from
                          </div>
                          <div className="font-medium text-foreground flex items-center justify-between">
                            <span>{eligiblePackages[0].name}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {eligiblePackages[0].remainingClasses} left
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Select package to deduct from</Label>
                          <Select value={selectedPkgId} onValueChange={setSelectedPkgId}>
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue placeholder="Select package" />
                            </SelectTrigger>
                            <SelectContent>
                              {eligiblePackages.map((pkg) => (
                                <SelectItem key={pkg._id} value={pkg._id} className="text-xs">
                                  {pkg.name} — {pkg.remainingClasses} sessions left
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <input type="hidden" name="uid" value={matchedMember.id} />
                      <input type="hidden" name="pkgId" value={selectedPkgId} />
                    </div>
                  ) : null}

                  {searchStatus === "idle" ? (
                    <p className="text-xs text-muted-foreground">
                      Enter the member's phone number to verify their package eligibility.
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g., 500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Date</Label>
                    <div onClick={(e) => e.stopPropagation()}>
                      <PopoverDatePicker
                        className="w-full"
                        selectedDate={
                          paymentDate === "" ? undefined : new Date(paymentDate)
                        }
                        handleDateChange={handleDateChange}
                      />
                    </div>
                    <input type="hidden" name="paymentDate" value={paymentDate} />
                  </div>
                </>
              )}
            </div>

            {fieldErrors && typeof fieldErrors.message === "string" && (
              <div className="flex items-center justify-between rounded-md border border-destructive p-3">
                <p className="text-destructive text-sm font-medium">
                  {fieldErrors.message}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                className="px-4"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4"
                disabled={!canSubmit}
              >
                {pending || isLoading ? "Saving..." : "Save Booking"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
