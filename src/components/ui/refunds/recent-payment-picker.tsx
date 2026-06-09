"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { tms } from "@/lib/tms-api";
import { ApiError } from "@/core/api-error";
import { MemberRecentPayment } from "@/lib/validations/refunds";

interface MemberRecentPaymentsResponse {
  data: MemberRecentPayment[];
}

function getApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const context = err.context as { message?: string; code?: string };
    return err.message ?? context.code ?? "An error occurred";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "An error occurred";
}

interface RecentPaymentPickerProps {
  memberId: string;
  disabled?: boolean;
  onPaymentIdChange: (paymentId: string | null) => void;
  onAmountPrefill: (amount: number) => void;
}

export function RecentPaymentPicker({
  memberId,
  disabled = false,
  onPaymentIdChange,
  onAmountPrefill,
}: RecentPaymentPickerProps) {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [selectedPaymentLabel, setSelectedPaymentLabel] = useState("");
  const [recentPayments, setRecentPayments] = useState<MemberRecentPayment[]>(
    []
  );
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPaymentId(null);
    setSelectedPaymentLabel("");
    setRecentPayments([]);
    setPaymentsOpen(false);
    setHasFetched(false);
    onPaymentIdChange(null);
  }, [memberId, onPaymentIdChange]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setPaymentsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const fetchRecentPayments = async () => {
    setPaymentsLoading(true);
    try {
      const response = await tms.get<MemberRecentPaymentsResponse>(
        `/admin/members/${memberId}/recent-payments`
      );
      setRecentPayments(response.data.data);
      setHasFetched(true);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
      setRecentPayments([]);
      setHasFetched(true);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleOpen = () => {
    if (disabled) return;
    setPaymentsOpen(true);
    if (!hasFetched && !paymentsLoading) {
      void fetchRecentPayments();
    }
  };

  const handleSelectPayment = (payment: MemberRecentPayment) => {
    setPaymentId(payment._id);
    setSelectedPaymentLabel(payment.label);
    onPaymentIdChange(payment._id);
    onAmountPrefill(payment.amount);
    setPaymentsOpen(false);
  };

  const handleClearPayment = () => {
    setPaymentId(null);
    setSelectedPaymentLabel("");
    onPaymentIdChange(null);
  };

  return (
    <div className="grid gap-2" ref={containerRef}>
      <Label htmlFor="recentPayment">What is this refund for?</Label>
      <div className="relative">
        <Input
          id="recentPayment"
          readOnly
          placeholder="Select a recent payment (optional)"
          disabled={disabled}
          value={selectedPaymentLabel}
          onClick={handleOpen}
          onFocus={handleOpen}
          className="cursor-pointer pr-10"
        />
        {paymentsLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {paymentId && !paymentsLoading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleClearPayment();
            }}
            disabled={disabled}
            aria-label="Clear selected payment"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {paymentsOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
            {paymentsLoading && (
              <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading payments…
              </div>
            )}
            {!paymentsLoading && recentPayments.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                No recent payments found for this member.
              </p>
            )}
            {!paymentsLoading &&
              recentPayments.map((payment) => (
                <button
                  key={payment._id}
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => handleSelectPayment(payment)}
                >
                  {payment.label}
                </button>
              ))}
          </div>
        )}
      </div>
      {paymentId && (
        <Button
          type="button"
          variant="link"
          className="h-auto w-fit p-0 text-xs text-muted-foreground"
          onClick={handleClearPayment}
          disabled={disabled}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
