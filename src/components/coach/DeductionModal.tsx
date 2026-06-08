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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { MemberPackageData } from "@/components/coach/PackageDetail";
import toast from "react-hot-toast";
import axios from "axios";

interface DeductionModalProps {
  open: boolean;
  memberId: string;
  memberPackageStartDate: string;
  pkgId: string;
  onClose: () => void;
  onSuccess: (updatedPackage: MemberPackageData) => void;
}

interface DeductResponse {
  package: MemberPackageData;
}

export function DeductionModal({
  open,
  memberId,
  memberPackageStartDate,
  pkgId,
  onClose,
  onSuccess,
}: DeductionModalProps) {
  const coachApi = useCoachApi();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema),
  });

  const handleClose = () => {
    reset();
    setApiError(null);
    onClose();
  };

  const onSubmit = async (values: DeductionFormValues) => {
    setApiError(null);
    try {
      const body = {
        memberId,
        memberPackageStartDate,
        reason: values.reason,
        sessionDate: values.sessionDate.toISOString(),
        sessionType: values.sessionType,
      };

      const res = await coachApi.post<DeductResponse>(
        "/api/coach/deduct",
        body
      );

      toast.success("Class deducted successfully.");
      onSuccess(res.data.package);
      handleClose();
    } catch (err: unknown) {
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
          <DialogTitle>Deduct Class</DialogTitle>
          <DialogDescription>
            Package: <span className="font-medium">{pkgId}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-5 py-2">
            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Describe the reason (min 5 chars)"
                disabled={isSubmitting}
                {...register("reason")}
              />
              {errors.reason && (
                <p className="text-destructive text-xs">
                  {errors.reason.message}
                </p>
              )}
            </div>

            {/* Session date */}
            <div className="grid gap-2">
              <Label htmlFor="sessionDate">Session Date</Label>
              <Controller
                name="sessionDate"
                control={control}
                render={({ field }) => (
                  <Input
                    id="sessionDate"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    disabled={isSubmitting}
                    value={
                      field.value
                        ? field.value.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val ? new Date(val) : undefined);
                    }}
                  />
                )}
              />
              {errors.sessionDate && (
                <p className="text-destructive text-xs">
                  {errors.sessionDate.message}
                </p>
              )}
            </div>

            {/* Session type */}
            <div className="grid gap-2">
              <Label htmlFor="sessionType">Session Type</Label>
              <Controller
                name="sessionType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="sessionType">
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">INDIVIDUAL</SelectItem>
                      <SelectItem value="GROUP">GROUP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sessionType && (
                <p className="text-destructive text-xs">
                  {errors.sessionType.message}
                </p>
              )}
            </div>

            {/* API-level error */}
            {apiError && (
              <p className="text-destructive text-sm rounded-md bg-destructive/10 px-3 py-2">
                {apiError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deducting…
                </>
              ) : (
                "Deduct class"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
