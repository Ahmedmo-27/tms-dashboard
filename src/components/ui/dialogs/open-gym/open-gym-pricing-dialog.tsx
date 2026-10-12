"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getOpenGymDropInPrices,
  setOpenGymDropInPrice,
  type OpenGymBranchPrice,
} from "@/lib/data/open-gym";
import { useBranchContext } from "@/lib/hooks/use-branch-context";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type OpenGymPricingDialogProps = {
  triggerLabel?: string;
  triggerClassName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onPriceUpdated?: () => void;
  // Retained for backward-compatibility with existing callers
  packages?: unknown[];
  classes?: unknown[];
};

export function OpenGymPricingDialog({
  triggerLabel = "Open gym pricing",
  triggerClassName,
  variant = "outline",
  size = "sm",
  hideTrigger = false,
  open: openProp,
  onOpenChange,
  onPriceUpdated,
}: OpenGymPricingDialogProps) {
  const router = useRouter();
  const { userLocationId, canViewAllBranches } = useBranchContext();

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setUncontrolledOpen(value);
    onOpenChange?.(value);
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<OpenGymBranchPrice[]>([]);
  const [branchInputs, setBranchInputs] = useState<Record<string, string>>({});
  const [batchPrice, setBatchPrice] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const branchList = await getOpenGymDropInPrices();
      setBranches(branchList);
      const bMap: Record<string, string> = {};
      branchList.forEach((b) => {
        bMap[b.locationId] = b.price != null ? String(b.price) : "";
      });
      setBranchInputs(bMap);
    } catch {
      toast.error("Failed to load open gym drop-in prices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const displayedBranches =
    !canViewAllBranches && userLocationId
      ? branches.filter((b) => b.locationId === userLocationId)
      : branches;

  const handleApplyBatchPrice = () => {
    const val = batchPrice.trim();
    if (!val || Number.isNaN(Number(val)) || Number(val) < 0) {
      toast.error("Please enter a valid price to apply to all branches.");
      return;
    }
    const updated: Record<string, string> = {};
    displayedBranches.forEach((b) => {
      updated[b.locationId] = val;
    });
    setBranchInputs((prev) => ({ ...prev, ...updated }));
    toast.success(`Applied ${val} EGP to all branches.`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const b of displayedBranches) {
      const val = branchInputs[b.locationId]?.trim();
      if (!val || Number.isNaN(Number(val)) || Number(val) < 0) {
        toast.error(`Please enter a valid price for ${b.branchName}`);
        return;
      }
    }

    setSaving(true);
    try {
      const promises = displayedBranches.map((b) => {
        const val = branchInputs[b.locationId]?.trim() || "0";
        return setOpenGymDropInPrice(b.locationId, Number(val));
      });
      await Promise.all(promises);
      toast.success("Open gym drop-in prices saved successfully!");
      onPriceUpdated?.();
      router.refresh();
      setOpen(false);
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(err) || "Failed to save open gym drop-in prices",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {!hideTrigger && (
        <Button
          variant={variant}
          size={size}
          className={
            triggerClassName ||
            "w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 px-2.5 sm:px-4"
          }
          onClick={() => setOpen(true)}
        >
          <span className="truncate">{triggerLabel}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Open gym drop-in pricing</DialogTitle>
            <DialogDescription>
              Configure the single-visit drop-in price for open gym sessions per
              branch.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading prices...
              </span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 pt-1">
              {displayedBranches.length > 1 && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    Quickly set the same drop-in price across all branches:
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 450"
                      value={batchPrice}
                      onChange={(e) => setBatchPrice(e.target.value)}
                      className="w-24 h-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleApplyBatchPrice}
                      className="h-8 text-xs shrink-0"
                    >
                      Apply to all
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {displayedBranches.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No branches found.
                  </p>
                ) : (
                  displayedBranches.map((b) => (
                    <div
                      key={b.locationId}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {b.branchName}
                        </p>
                        {b.location && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {b.location}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          min="0"
                          value={branchInputs[b.locationId] ?? ""}
                          onChange={(e) =>
                            setBranchInputs((prev) => ({
                              ...prev,
                              [b.locationId]: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-28 text-right font-medium"
                          required
                        />
                        <span className="text-xs text-muted-foreground w-8">
                          EGP
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || displayedBranches.length === 0}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save open gym pricing"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
