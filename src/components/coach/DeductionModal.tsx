"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deductionSchema, DeductionFormValues } from "@/lib/validations/coach";
import { useCoachApi } from "@/hooks/useCoachApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { MemberPackageData } from "@/components/coach/PackageDetail";
import toast from "react-hot-toast";
import axios from "axios";
import { cn } from "@/lib/utils";

const REASON_CHIPS = ["Completed session", "No-show", "Makeup"] as const;

function parseLocalDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toLocalInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toStoredIso(date: Date): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0
  ).toISOString();
}

interface DeductionModalProps {
  open: boolean;
  memberId: string;
  memberName?: string;
  remainingClasses?: number;
  memberPackageStartDate: string;
  pkgId: string;
  pkgName?: string;
  onClose: () => void;
  onSuccess: (updatedPackage: MemberPackageData) => void;
}

interface DeductResponse {
  statusCode: number;
  message: string;
  data: {
    package: MemberPackageData;
  };
}

export function DeductionModal({
  open,
  memberId,
  memberName,
  remainingClasses,
  memberPackageStartDate,
  pkgId,
  pkgName,
  onClose,
  onSuccess,
}: DeductionModalProps) {
  const coachApi = useCoachApi();
  const [apiError, setApiError] = useState<string | null>(null);
  const [chip, setChip] = useState<string>(REASON_CHIPS[0]);
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      sessionDate: new Date(),
    },
  });

  const composedReason = notes.trim()
    ? `${chip}. ${notes.trim()}`
    : chip;

  const handleClose = () => {
    reset();
    setApiError(null);
    setChip(REASON_CHIPS[0]);
    setNotes("");
    setConfirming(false);
    onClose();
  };

  const onSubmit = async (values: DeductionFormValues) => {
    const reason = composedReason.length >= 5 ? composedReason : `${chip} session`;
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setApiError(null);
    try {
      const body = {
        memberId,
        memberPackageStartDate,
        reason,
        sessionDate: toStoredIso(values.sessionDate),
      };

      const res = await coachApi.post<DeductResponse>("/api/coach/deduct", body);
      toast.success("Class deducted successfully.");
      onSuccess(res.data.data.package);
      handleClose();
    } catch (err: unknown) {
      setConfirming(false);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const serverMessage = err.response?.data?.message as string | undefined;

        if (status === 403) {
          setApiError(
            "You don't have a scheduled session with this member for this package."
          );
        } else if (status === 400 && serverMessage === "NO_CLASSES_REMAINING") {
          setApiError("This package has no remaining classes.");
        } else if (status === 400 && serverMessage === "PACKAGE_NOT_ACTIVE") {
          setApiError("This package is no longer active.");
        } else {
          setApiError(serverMessage ?? "An unexpected error occurred.");
        }
      } else {
        setApiError("An unexpected error occurred.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{confirming ? "Confirm deduction" : "Deduct Class"}</DialogTitle>
          <DialogDescription>
            Package: <span className="font-medium">{pkgName || pkgId}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {confirming ? (
            <div className="space-y-2 py-2 text-sm">
              {memberName && (
                <p>
                  <span className="text-muted-foreground">Member · </span>
                  {memberName}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Package · </span>
                {pkgName || pkgId}
              </p>
              {remainingClasses !== undefined && (
                <p>
                  <span className="text-muted-foreground">Remaining after · </span>
                  {Math.max(0, remainingClasses - 1)}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Reason · </span>
                {composedReason}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 py-2">
              <div className="grid gap-2">
                <Label>Reason</Label>
                <div className="flex flex-wrap gap-2">
                  {REASON_CHIPS.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant={chip === item ? "default" : "outline"}
                      onClick={() => setChip(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Optional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sessionDate">Session Date</Label>
                <Controller
                  name="sessionDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="sessionDate"
                      type="date"
                      max={toLocalInputValue(new Date())}
                      disabled={isSubmitting}
                      value={field.value ? toLocalInputValue(field.value) : ""}
                      onChange={(e) => {
                        const parsed = parseLocalDate(e.target.value);
                        field.onChange(parsed);
                      }}
                    />
                  )}
                />
                {errors.sessionDate && (
                  <p className="text-xs text-destructive">{errors.sessionDate.message}</p>
                )}
              </div>
            </div>
          )}

          {apiError && (
            <p className={cn("mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive")}>
              {apiError}
            </p>
          )}

          <DialogFooter className="mt-4">
            {confirming ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deducting…
                </>
              ) : confirming ? (
                "Confirm deduct"
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
