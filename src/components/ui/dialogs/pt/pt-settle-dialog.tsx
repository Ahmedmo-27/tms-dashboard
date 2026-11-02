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
  DialogTrigger,
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
import { AlertCircle, CheckCircle2, CreditCard, DollarSign } from "lucide-react";
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

export interface PtSettleDialogProps {
  sessionId?: string; // owedPtSession._id or attendanceRowId
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

  const [settlementType, setSettlementType] = useState<"PAYMENT" | "DEDUCTED" | "FOC">("PAYMENT");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amount, setAmount] = useState<string>(String(initialAmount || 750));
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
      setAmount(String(initialAmount || 750));
      setPaymentDate("");
      setNote("");
      setSelectedPkgId("");
    }
  };

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

  const initialState: FormState = { success: false, errors: null, data: null };
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (currentState: FormState, formData: FormData) => {
      const result = await settleOwedPtSessionAction(currentState, formData);
      if (result.success) {
        toast.success("Owed PT session settled successfully");
        handleOpenChange(false);
        onSuccess?.();
        router.refresh();
        return initialState;
      }
      return result;
    },
    initialState
  );

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
            <DialogTitle>Settle Owed PT Session</DialogTitle>
            <DialogDescription>
              Record payment, deduct from an active package, or waive this unpaid session.
            </DialogDescription>
          </DialogHeader>

          {/* Session Overview */}
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{clientName || "Client"}</span>
              <span className="text-xs text-muted-foreground">{phoneNumber || "No phone"}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Trainer: <strong className="text-foreground">{coachName || "Coach"}</strong></span>
              {attendanceDate && (
                <span>
                  Date: {format(new Date(attendanceDate), "dd MMM yyyy")}
                </span>
              )}
            </div>
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
              <input type="hidden" name="sessionId" value={sessionId || ""} />
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
                    <Label>Amount (EGP)</Label>
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
                    1 session will be deducted from this package to cover the owed visit.
                  </p>
                </div>
              </TabsContent>

              {/* FOC TAB */}
              <TabsContent value="FOC" className="space-y-3 m-0">
                <input type="hidden" name="note" value={note} />
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  This session will be marked as Free of Charge (FOC) / complimentary. No payment or package deduction will be recorded.
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
                  !sessionId ||
                  (settlementType === "DEDUCTED" && !selectedPkgId) ||
                  (settlementType === "PAYMENT" && (!amount || Number(amount) < 0))
                }
              >
                {pending ? "Settling..." : "Confirm Settlement"}
              </Button>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
