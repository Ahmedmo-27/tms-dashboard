"use client";

import React, { useEffect, useState } from "react";
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
import { KeyRound, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPaymentsPin, updatePaymentsPin } from "@/lib/data/payments";
import { useLocations } from "@/lib/hooks/use-locations";

interface ManagePaymentsPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLocationId?: string | null;
}

export function ManagePaymentsPinDialog({
  open,
  onOpenChange,
  selectedLocationId,
}: ManagePaymentsPinDialogProps) {
  const { locations } = useLocations(open);
  const [targetLocationId, setTargetLocationId] = useState<string>(
    selectedLocationId || "ALL"
  );
  const [currentPin, setCurrentPin] = useState<string>("1967");
  const [newPin, setNewPin] = useState<string>("");
  const [applyToAll, setApplyToAll] = useState<boolean>(!selectedLocationId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (selectedLocationId) {
      setTargetLocationId(selectedLocationId);
      setApplyToAll(false);
    } else {
      setTargetLocationId("ALL");
      setApplyToAll(true);
    }
  }, [selectedLocationId, open]);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setIsLoading(true);

    const locId = targetLocationId === "ALL" ? undefined : targetLocationId;
    getPaymentsPin(locId)
      .then((data) => {
        if (!isMounted) return;
        if (data.pin) {
          setCurrentPin(data.pin);
          setNewPin(data.pin);
        } else if (data.defaultPin) {
          setCurrentPin(data.defaultPin);
          setNewPin(data.defaultPin);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch payments PIN:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, targetLocationId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPin.trim();

    if (!trimmed || !/^\d{4,8}$/.test(trimmed)) {
      toast.error("PIN must be between 4 and 8 digits");
      return;
    }

    setIsSaving(true);
    try {
      const locId =
        applyToAll || targetLocationId === "ALL" ? undefined : targetLocationId;
      await updatePaymentsPin(trimmed, locId, applyToAll || targetLocationId === "ALL");
      setCurrentPin(trimmed);
      toast.success(
        applyToAll || targetLocationId === "ALL"
          ? "Payments PIN updated for all branches"
          : "Branch payments PIN updated successfully"
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update PIN:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update PIN"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Set Branch Admin Payments PIN</DialogTitle>
              <DialogDescription className="text-xs">
                Configure the security PIN required by branch admins to open payments.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading current PIN settings...</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="branch-select" className="text-xs">
                  Branch Scope
                </Label>
                <select
                  id="branch-select"
                  value={targetLocationId}
                  onChange={(e) => {
                    setTargetLocationId(e.target.value);
                    setApplyToAll(e.target.value === "ALL");
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ALL">All Branches (Global PIN)</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.branchName || loc.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pin-input" className="text-xs">
                    Payments PIN (4–8 digits)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Current: <strong className="font-mono text-foreground">{currentPin}</strong>
                  </span>
                </div>
                <Input
                  id="pin-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 1967"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  maxLength={8}
                  className="font-mono tracking-widest text-base"
                  autoFocus
                />
              </div>

              {targetLocationId !== "ALL" && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="apply-all"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="apply-all" className="text-xs font-normal text-muted-foreground cursor-pointer">
                    Apply this PIN to all other branches as well
                  </Label>
                </div>
              )}
            </>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || isLoading || !newPin.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Save PIN
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
