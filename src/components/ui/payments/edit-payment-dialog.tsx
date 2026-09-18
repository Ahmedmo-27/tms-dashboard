"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/lib/hooks/use-locations";
import { updatePayment } from "@/lib/data/payments";
import { Payment } from "./columns";
import { toast } from "react-hot-toast";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface EditPaymentDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentUpdated: () => void;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "INSTAPAY", label: "InstaPay" },
  { value: "VISA", label: "Visa / POS" },
  { value: "VALU", label: "valU" },
  { value: "APP", label: "Mobile App / Online Gateway" },
  { value: "PAYMENT_LINK", label: "Payment Link" },
  { value: "DEDUCTED", label: "Deducted" },
];

const PAYMENT_PURPOSES = [
  { value: "DROPIN", label: "Drop-in" },
  { value: "PACKAGE", label: "Package" },
  { value: "WALKIN", label: "Walk-in" },
  { value: "NON_USER_BOOKING", label: "Non-user Booking" },
  { value: "NON_USER_PACKAGE", label: "Non-user Package" },
  { value: "OTHER", label: "Other" },
];

export function EditPaymentDialog({
  payment,
  open,
  onOpenChange,
  onPaymentUpdated,
}: EditPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { locations, isLoading: locationsLoading } = useLocations(true);

  // Form states
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentTime, setPaymentTime] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("OTHER");
  const [locationId, setLocationId] = useState<string>("");
  const [nonMemberName, setNonMemberName] = useState<string>("");
  const [nonMemberPhone, setNonMemberPhone] = useState<string>("");
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (payment) {
      const numericAmount = typeof payment.amount === "string"
        ? payment.amount.replace(/[^0-9.-]+/g, "")
        : String(payment.amount);
      setAmount(numericAmount || "0");

      const methodUpper = (payment.paymentMethod || "").toUpperCase();
      const matchedMethod = PAYMENT_METHODS.some((m) => m.value === methodUpper)
        ? methodUpper
        : "CASH";
      setPaymentMethod(matchedMethod);

      try {
        const d = new Date(payment.paymentTime);
        if (!isNaN(d.getTime())) {
          setPaymentTime(format(d, "yyyy-MM-dd'T'HH:mm"));
        } else {
          setPaymentTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        }
      } catch {
        setPaymentTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      }

      const raw = payment.rawPayment;
      const rawPurpose = (raw?.purpose || "").toUpperCase();
      const matchedPurpose = PAYMENT_PURPOSES.some((p) => p.value === rawPurpose)
        ? rawPurpose
        : "OTHER";
      setPurpose(matchedPurpose);

      // Location resolution
      let locId = payment.locationId || "";
      if (!locId && raw?.locationId) {
        locId = typeof raw.locationId === "object" ? (raw.locationId as any)?._id || "" : String(raw.locationId);
      }
      if (!locId && locations.length > 0 && payment.location) {
        const found = locations.find(
          (l) =>
            l.branchName.toLowerCase() === payment.location.toLowerCase() ||
            l.location.toLowerCase() === payment.location.toLowerCase()
        );
        if (found) locId = found._id;
      }
      setLocationId(locId);

      setNonMemberName(raw?.nonMemberName || "");
      setNonMemberPhone(raw?.nonMemberPhone || "");
      setNote(payment.note || raw?.note || "");
    }
  }, [payment, locations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    const paymentId = payment._id || payment.id;
    if (!paymentId) {
      toast.error("Invalid payment record ID");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (!paymentTime) {
      toast.error("Please enter a valid date and time");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePayment({
        _id: paymentId,
        amount: parsedAmount,
        paymentMethod,
        paymentTime: new Date(paymentTime).toISOString(),
        purpose,
        locationId: locationId || undefined,
        nonMemberName: nonMemberName.trim() || undefined,
        nonMemberPhone: nonMemberPhone.trim() || undefined,
        note: note.trim(),
      });

      toast.success("Payment record updated successfully!");
      onOpenChange(false);
      onPaymentUpdated();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update payment record";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Edit Payment Record
          </DialogTitle>
          <DialogDescription>
            Modify payment amount, method, branch, or notes. Restricted to management roles.
          </DialogDescription>
        </DialogHeader>

        {payment.isRefunded && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <strong>Note:</strong> This payment has been recorded as refunded. Modifying the payment details will update the audit record but will not alter processed refunds.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Member Name (Read-only if registered member) */}
          <div className="space-y-1.5">
            <Label>Payer / Member</Label>
            <Input
              value={payment.memberName || "—"}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Amount & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-amount">Amount (EGP) *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="edit-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date/Time & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-time">Payment Date & Time *</Label>
              <Input
                id="edit-time"
                type="datetime-local"
                value={paymentTime}
                onChange={(e) => setPaymentTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-purpose">Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger id="edit-purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location / Branch */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-location">Branch Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger id="edit-location">
                <SelectValue placeholder="Select branch..." />
              </SelectTrigger>
              <SelectContent>
                {locationsLoading ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    Loading branches...
                  </div>
                ) : locations.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    No branches found
                  </div>
                ) : (
                  locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.branchName} ({loc.location})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Optional Walk-in / Non-member details */}
          {(payment.rawPayment?.nonMemberName || purpose === "WALKIN" || purpose === "OTHER") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nonMemberName">Non-Member Name</Label>
                <Input
                  id="edit-nonMemberName"
                  placeholder="e.g. Omar Tarek"
                  value={nonMemberName}
                  onChange={(e) => setNonMemberName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-nonMemberPhone">Non-Member Phone</Label>
                <Input
                  id="edit-nonMemberPhone"
                  placeholder="e.g. 01012345678"
                  value={nonMemberPhone}
                  onChange={(e) => setNonMemberPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-note">Notes / Remarks</Label>
            <Input
              id="edit-note"
              placeholder="Add details, receipt reference, or reason for correction..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
