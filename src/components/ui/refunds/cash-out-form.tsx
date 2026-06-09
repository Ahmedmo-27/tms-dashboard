"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
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
import { tms } from "@/lib/tms-api";
import { ApiError } from "@/core/api-error";
import { cashOutSchema, CashOutFormValues } from "@/lib/validations/refunds";
import { RecordedAtField } from "./recorded-at-field";
import { cn } from "@/lib/utils";

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

export function CashOutForm() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CashOutFormValues>({
    resolver: zodResolver(cashOutSchema),
    defaultValues: {
      reason: "",
      amount: undefined,
    },
  });

  const amount = watch("amount");
  const displayAmount =
    typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;

  const onSubmit = async (values: CashOutFormValues) => {
    try {
      await tms.post("/api/admin/refunds/cashout", {
        reason: values.reason,
        amount: values.amount,
      });
      toast.success("Cash out recorded successfully");
      reset();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Cash Out</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="cashOutReason">Reason</Label>
              <Textarea
                id="cashOutReason"
                placeholder="Describe the reason for this cash out (min 5 characters)"
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
              <Label htmlFor="cashOutAmount">Amount</Label>
              <div className="relative">
                <Input
                  id="cashOutAmount"
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
                This will record a cash out of EGP {displayAmount}
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
                "Record Cash Out"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
