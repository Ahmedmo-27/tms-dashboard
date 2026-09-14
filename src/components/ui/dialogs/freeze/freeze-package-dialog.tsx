"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { adminFreezePackageAction } from "@/lib/actions/freeze-actions";
import { Snowflake, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { MemberPackage } from "@/components/ui/members/columns";

export function FreezePackageDialog({
  pkg,
  uid,
  variant = "none",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: {
  pkg: MemberPackage;
  uid: string;
  variant?: "menu" | "button" | "none";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [loading, setLoading] = useState(false);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks">("days");
  const [reason, setReason] = useState("");

  const handleFreeze = async () => {
    try {
      setLoading(true);
      const days = durationUnit === "weeks" ? durationDays * 7 : durationDays;
      if (days < 1) {
        toast.error("Please enter a valid duration (at least 1 day)");
        return;
      }

      const formData = new FormData();
      formData.set("uid", uid);
      formData.set("pkgId", pkg._id);
      formData.set("pkgStartDate", pkg.pkgStartDate);
      formData.set("durationDays", String(days));
      if (reason.trim()) {
        formData.set("reason", reason.trim());
      }

      const res = await adminFreezePackageAction(null, formData);

      if (res.success) {
        toast.success(`Package frozen for ${days} days!`);
        setOpen(false);
        onSuccess?.();
      } else {
        const errorMsg =
          (res.errors as { message?: string; clientMessage?: string })?.message ||
          (res.errors as { message?: string; clientMessage?: string })?.clientMessage ||
          "Failed to freeze package";
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {variant === "button" && (
        <Button size="sm" variant="outline" className="h-8 gap-1 text-sky-600 border-sky-300 dark:border-sky-800" onClick={() => setOpen(true)}>
          <Snowflake className="h-3.5 w-3.5" />
          Freeze
        </Button>
      )}
      {variant === "menu" && (
        <DropdownMenuItem
          onSelect={() => setOpen(true)}
          className="cursor-pointer text-sky-600 focus:text-sky-700"
        >
          <Snowflake className="h-4 w-4 mr-2" />
          Freeze package
        </DropdownMenuItem>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-sky-500" />
            Freeze Package: {pkg.name}
          </DialogTitle>
          <DialogDescription>
            Freezing pauses the package and extends its expiry date by the frozen duration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="freezeDuration">Freeze Duration</Label>
            <div className="flex items-center gap-2">
              <Input
                id="freezeDuration"
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="flex-1"
              />
              <select
                value={durationUnit}
                onChange={(e) => {
                  const newUnit = e.target.value as "days" | "weeks";
                  if (newUnit === "weeks" && durationUnit === "days") {
                    setDurationDays(Math.max(1, Math.round(durationDays / 7)));
                  } else if (newUnit === "days" && durationUnit === "weeks") {
                    setDurationDays(durationDays * 7);
                  }
                  setDurationUnit(newUnit);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="freezeReason">Reason (Optional)</Label>
            <Textarea
              id="freezeReason"
              placeholder="e.g. Travel, medical leave, member request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-sky-600 hover:bg-sky-700 text-white"
            onClick={handleFreeze}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Freeze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
