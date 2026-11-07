"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { settleOwedPtSessionAction } from "@/lib/actions/pt-actions";
import { getMembers } from "@/lib/data/member";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { AlertCircle, DollarSign } from "lucide-react";
import type { MemberPackage } from "@/components/ui/members/columns";

const paymentMethods = [
  { value: "CASH", header: "Cash" },
  { value: "VISA", header: "Visa" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "VALU", header: "Valu" },
];

type FormState = {
  success: boolean;
  errors: any;
  data: any;
};

export type PtSettleSessionInput = {
  sessionId: string;
  amount?: number;
  attendanceDate?: string;
};

export interface PtSettleDialogProps {
  sessionId?: string; // owedPtSession._id or attendanceRowId
  /** Settle multiple owed sessions in one confirmation (e.g. same coach). */
  sessions?: PtSettleSessionInput[];
  clientName?: string;
  phoneNumber?: string;
  coachName?: string;
  coachId?: string;
  initialAmount?: number;
  attendanceDate?: string;
  uid?: string;
  memberPackages?: MemberPackage[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function PtSettleDialog({
  sessionId,
  sessions,
  clientName,
  phoneNumber,
  coachName,
  coachId,
  initialAmount = 750,
  attendanceDate,
  uid,
  memberPackages: preloadedPackages,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSuccess,
}: PtSettleDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const resolvedSessions = useMemo<PtSettleSessionInput[]>(() => {
    if (sessions && sessions.length > 0) {
      return sessions.filter((s) => Boolean(s.sessionId));
    }
    if (sessionId) {
      return [
        {
          sessionId,
          amount: initialAmount,
          attendanceDate,
        },
      ];
    }
    return [];
  }, [sessions, sessionId, initialAmount, attendanceDate]);

  const sessionCount = resolvedSessions.length;
  const defaultAmount = useMemo(() => {
    if (sessionCount === 0) return initialAmount || 750;
    const sum = resolvedSessions.reduce(
      (total, session) => total + (Number(session.amount) || 0),
      0
    );
    if (sum > 0) return sum;
    return (initialAmount || 750) * Math.max(sessionCount, 1);
  }, [resolvedSessions, sessionCount, initialAmount]);

  const [settlementType, setSettlementType] = useState<"PAYMENT" | "DEDUCTED" | "FOC">("PAYMENT");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amount, setAmount] = useState<string>(String(defaultAmount));
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [selectedPkgId, setSelectedPkgId] = useState<string>("");

  const [packages, setPackages] = useState<MemberPackage[]>(preloadedPackages ?? []);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
    if (!nextOpen) {
      setSettlementType("PAYMENT");
      setPaymentMethod("CASH");
      setAmount(String(defaultAmount));
      setPaymentDate("");
      setNote("");
      setSelectedPkgId("");
    }
  };

  useEffect(() => {
    if (open) {
      setAmount(String(defaultAmount));
    }
  }, [open, defaultAmount]);

  // Fetch member packages if not passed and uid is available
  useEffect(() => {
    if (!open || !uid) return;
    if (preloadedPackages && preloadedPackages.length > 0) {
      setPackages(preloadedPackages);
      return;
    }
    setLoadingPackages(true);
    getMembers("", 1, 1, uid)
      .then((res) => {
        const m = res?.data?.[0];
        if (m?.packages) {
          setPackages(m.packages);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPackages(false));
  }, [open, uid, preloadedPackages]);

  // Filter packages that match this trainer
  const matchingPackages = packages.filter((p) => {
    const isPt = p.remainingClasses > 0 && p.status === "ACTIVE";
    return isPt;
  });

  const selectedPackage = matchingPackages.find((p) => p._id === selectedPkgId);
  const hasEnoughSessionsForDeduction =
    !selectedPackage || selectedPackage.remainingClasses >= sessionCount;

  const initialState: FormState = { success: false, errors: null, data: null };
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (currentState: FormState, formData: FormData) => {
      const result = await settleOwedPtSessionAction(currentState, formData);
      if (result.success) {
        toast.success(
          sessionCount > 1
            ? `${sessionCount} owed PT sessions settled successfully`
            : "Owed PT session settled successfully"
        );
        handleOpenChange(false);
        onSuccess?.();
        router.refresh();
        return initialState;
      }
      return result;
    },
    initialState
  );

  const sessionIdsValue = resolvedSessions.map((s) => s.sessionId).join(",");
  const primarySession = resolvedSessions[0];

  return (
    <>
      {trigger ? (
        <span onClick={() => handleOpenChange(true)}>{trigger}</span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
          onClick={() => handleOpenChange(true)}
        >
          <DollarSign className="h-3 w-3" />
          Settle
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {sessionCount > 1
                ? `Settle ${sessionCount} Owed PT Sessions`
                : "Settle Owed PT Session"}
            </DialogTitle>
            <DialogDescription>
              {sessionCount > 1
                ? "Record payment, deduct from an active package, or waive these unpaid sessions with this trainer."
                : "Record payment, deduct from an active package, or waive this unpaid session."}
            </DialogDescription>
          </DialogHeader>

          {/* Session Overview */}
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{clientName || "Client"}</span>
              <span className="text-xs text-muted-foreground">{phoneNumber || "No phone"}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Trainer:{" "}
                <strong className="text-foreground">{coachName || "Coach"}</strong>
              </span>
              {sessionCount === 1 && primarySession?.attendanceDate && (
                <span>
                  Date:{" "}
                  {format(new Date(primarySession.attendanceDate), "dd MMM yyyy")}
                </span>
              )}
              {sessionCount > 1 && (
                <span>
                  {sessionCount} unpaid sessions
                </span>
              )}
            </div>
            {sessionCount > 1 && (
              <ul className="pt-1 space-y-0.5 text-xs text-muted-foreground">
                {resolvedSessions.map((session) => (
                  <li key={session.sessionId} className="flex justify-between gap-2">
                    <span>
                      {session.attendanceDate
                        ? format(new Date(session.attendanceDate), "dd MMM yyyy")
                        : "Unknown date"}
                    </span>
                    <span>
                      {Number(session.amount || 0).toLocaleString()} EGP
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Tabs
            value={settlementType}
            onValueChange={(val) => setSettlementType(val as "PAYMENT" | "DEDUCTED" | "FOC")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="PAYMENT">Pay at Desk</TabsTrigger>
              <TabsTrigger value="DEDUCTED">From Package</TabsTrigger>
              <TabsTrigger value="FOC">FOC / Waive</TabsTrigger>
            </TabsList>

            <form action={formAction} className="space-y-4 pt-3">
              <input type="hidden" name="sessionId" value={primarySession?.sessionId || ""} />
              <input type="hidden" name="sessionIds" value={sessionIdsValue} />
              <input type="hidden" name="settlementType" value={settlementType} />

              {/* PAYMENT TAB */}
              <TabsContent value="PAYMENT" className="space-y-3 m-0">
                <input type="hidden" name="paymentMethod" value={paymentMethod} />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="paymentDate" value={paymentDate} />
                <input type="hidden" name="note" value={note} />

                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          {pm.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>
                      {sessionCount > 1 ? "Total Amount (EGP)" : "Amount (EGP)"}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Date</Label>
                    <PopoverDatePicker
                      className="w-full"
                      selectedDate={paymentDate ? new Date(paymentDate) : undefined}
                      handleDateChange={setPaymentDate}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Note (Optional)</Label>
                  <Input
                    placeholder="e.g. Paid in cash at reception"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* DEDUCTED TAB */}
              <TabsContent value="DEDUCTED" className="space-y-3 m-0">
                <input type="hidden" name="pkgId" value={selectedPkgId} />

                <div className="space-y-1.5">
                  <Label>Select Package to Deduct From</Label>
                  {loadingPackages ? (
                    <p className="text-xs text-muted-foreground">Loading packages...</p>
                  ) : matchingPackages.length === 0 ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        No active PT packages found with remaining sessions. Purchase a package with Coach {coachName || "this trainer"} or collect payment at desk.
                      </span>
                    </div>
                  ) : (
                    <Select value={selectedPkgId} onValueChange={setSelectedPkgId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a package" />
                      </SelectTrigger>
                      <SelectContent>
                        {matchingPackages.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.name} ({p.remainingClasses} left)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {sessionCount > 1
                      ? `${sessionCount} sessions will be deducted from this package to cover the owed visits.`
                      : "1 session will be deducted from this package to cover the owed visit."}
                  </p>
                  {selectedPackage && !hasEnoughSessionsForDeduction && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                      Selected package only has {selectedPackage.remainingClasses} session
                      {selectedPackage.remainingClasses === 1 ? "" : "s"} left, but {sessionCount} are owed.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* FOC TAB */}
              <TabsContent value="FOC" className="space-y-3 m-0">
                <input type="hidden" name="note" value={note} />
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  {sessionCount > 1
                    ? `These ${sessionCount} sessions will be marked as Free of Charge (FOC) / complimentary. No payment or package deduction will be recorded.`
                    : "This session will be marked as Free of Charge (FOC) / complimentary. No payment or package deduction will be recorded."}
                </div>
                <div className="space-y-1.5">
                  <Label>Reason / Note</Label>
                  <Input
                    placeholder="e.g. Approved trial / complimentary session"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </TabsContent>

              {state?.errors && (
                <p className="text-sm text-red-500">
                  {typeof state.errors === "string"
                    ? state.errors
                    : Object.values(state.errors).filter(Boolean).join(", ")}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  pending ||
                  sessionCount === 0 ||
                  (settlementType === "DEDUCTED" &&
                    (!selectedPkgId || !hasEnoughSessionsForDeduction)) ||
                  (settlementType === "PAYMENT" && (!amount || Number(amount) < 0))
                }
              >
                {pending
                  ? "Settling..."
                  : sessionCount > 1
                    ? `Confirm Settlement (${sessionCount})`
                    : "Confirm Settlement"}
              </Button>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
