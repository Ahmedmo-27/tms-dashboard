"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { tms } from "@/lib/tms-api";
import { ApiError } from "@/core/api-error";
import {
  memberRefundSchema,
  MemberRefundFormValues,
  MemberSearchResultDto,
} from "@/lib/validations/refunds";
import { RecordedAtField } from "./recorded-at-field";
import { RecentPaymentPicker } from "./recent-payment-picker";
import { cn } from "@/lib/utils";

interface MemberSearchResponse {
  data: MemberSearchResultDto[];
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

export function MemberRefundForm() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [linkedMemberName, setLinkedMemberName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MemberSearchResultDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MemberRefundFormValues>({
    resolver: zodResolver(memberRefundSchema),
    defaultValues: {
      memberName: "",
      reason: "",
      amount: undefined,
    },
  });

  const amount = watch("amount");
  const displayAmount =
    typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;

  const handlePaymentIdChange = useCallback((id: string | null) => {
    setPaymentId(id);
  }, []);

  const handleAmountPrefill = useCallback(
    (value: number) => {
      setValue("amount", value, { shouldValidate: true });
    },
    [setValue]
  );

  const clearPaymentSelection = useCallback(() => {
    setPaymentId(null);
  }, []);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await tms.get<MemberSearchResponse>(
          "/api/admin/members/search",
          { params: { name: searchQuery } }
        );
        setSuggestions(response.data.data.slice(0, 10));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleMemberNameChange = (value: string) => {
    setValue("memberName", value, { shouldValidate: true });
    setSearchQuery(value);

    if (memberId && value !== linkedMemberName) {
      setMemberId(null);
      setLinkedMemberName(null);
      clearPaymentSelection();
    }
  };

  const handleSelectMember = (member: MemberSearchResultDto) => {
    setValue("memberName", member.name, { shouldValidate: true });
    setSearchQuery(member.name);
    clearPaymentSelection();
    setMemberId(member._id);
    setLinkedMemberName(member.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleFormReset = () => {
    reset();
    setMemberId(null);
    setPaymentId(null);
    setLinkedMemberName(null);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const onSubmit = async (values: MemberRefundFormValues) => {
    try {
      const body: {
        memberName: string;
        reason: string;
        amount: number;
        memberId?: string;
        paymentId?: string;
      } = {
        memberName: values.memberName,
        reason: values.reason,
        amount: values.amount,
      };

      if (memberId) {
        body.memberId = memberId;
      }

      if (paymentId) {
        body.paymentId = paymentId;
      }

      await tms.post("/api/admin/refunds/member", body);
      toast.success("Refund recorded successfully");
      handleFormReset();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Member Refund</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-5">
            <input type="hidden" {...register("memberName")} />

            <div className="grid gap-2" ref={searchContainerRef}>
              <Label htmlFor="memberName">Member name</Label>
              <div className="relative">
                <Input
                  id="memberName"
                  placeholder="Search by member name"
                  autoComplete="off"
                  disabled={isSubmitting}
                  value={searchQuery}
                  onChange={(e) => handleMemberNameChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {suggestions.map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => handleSelectMember(member)}
                      >
                        <span className="font-medium">{member.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {member.phoneNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {memberId && (
                <Badge
                  variant="outline"
                  className="w-fit border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
                >
                  <Check className="h-3 w-3" />
                  Linked to member
                </Badge>
              )}
              {errors.memberName && (
                <p className="text-destructive text-sm">
                  {errors.memberName.message}
                </p>
              )}
            </div>

            {memberId && (
              <RecentPaymentPicker
                memberId={memberId}
                disabled={isSubmitting}
                onPaymentIdChange={handlePaymentIdChange}
                onAmountPrefill={handleAmountPrefill}
              />
            )}

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for this refund (min 5 characters)"
                disabled={isSubmitting}
                rows={3}
                {...register("reason")}
              />
              {errors.reason && (
                <p className="text-destructive text-sm">
                  {errors.reason.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  disabled={isSubmitting}
                  className="pr-14"
                  {...register("amount", { valueAsNumber: true })}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  EGP
                </span>
              </div>
              {errors.amount && (
                <p className="text-destructive text-sm">
                  {errors.amount.message}
                </p>
              )}
              <p
                className={cn(
                  "text-sm text-muted-foreground",
                  displayAmount > 0 && "text-foreground"
                )}
              >
                This will record a refund of EGP {displayAmount}
              </p>
            </div>

            <RecordedAtField />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording…
                </>
              ) : (
                "Record Refund"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
