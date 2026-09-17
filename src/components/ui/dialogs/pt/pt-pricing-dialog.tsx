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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPtDropInPrices,
  setPtDropInPrice,
  getPtCoachDropInPrices,
  setPtCoachDropInPrice,
  type PtBranchPrice,
  type PtCoachPrice,
} from "@/lib/data/pt";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import { Building2, Check, Loader2, RotateCcw, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type PtPricingDialogProps = {
  triggerLabel?: string;
  triggerClassName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onPriceUpdated?: () => void;
};

export function PtPricingDialog({
  triggerLabel = "PT pricing",
  triggerClassName,
  variant = "outline",
  size = "sm",
  hideTrigger = false,
  open: openProp,
  onOpenChange,
  onPriceUpdated,
}: PtPricingDialogProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setUncontrolledOpen(value);
    onOpenChange?.(value);
  };

  const [activeTab, setActiveTab] = useState<"branches" | "coaches">("branches");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Branch pricing state
  const [branches, setBranches] = useState<PtBranchPrice[]>([]);
  const [branchInputs, setBranchInputs] = useState<Record<string, string>>({});
  const [batchPrice, setBatchPrice] = useState("");

  // Coach pricing state
  const [coaches, setCoaches] = useState<PtCoachPrice[]>([]);
  const [coachInputs, setCoachInputs] = useState<Record<string, string>>({});
  const [coachSearch, setCoachSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchList, coachList] = await Promise.all([
        getPtDropInPrices().catch(() => []),
        getPtCoachDropInPrices().catch(() => []),
      ]);

      setBranches(branchList);
      const bMap: Record<string, string> = {};
      branchList.forEach((b) => {
        bMap[b.locationId] = b.price != null ? String(b.price) : "750";
      });
      setBranchInputs(bMap);

      setCoaches(coachList);
      const cMap: Record<string, string> = {};
      coachList.forEach((c) => {
        cMap[c.coachId] = c.price != null ? String(c.price) : "";
      });
      setCoachInputs(cMap);
    } catch {
      toast.error("Failed to load PT drop-in pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Handle batch update for branches
  const handleApplyBatchPrice = () => {
    const val = batchPrice.trim();
    if (!val || Number.isNaN(Number(val)) || Number(val) < 0) {
      toast.error("Please enter a valid price to apply to all branches.");
      return;
    }
    const updated: Record<string, string> = {};
    branches.forEach((b) => {
      updated[b.locationId] = val;
    });
    setBranchInputs(updated);
    toast.success(`Applied ${val} EGP to all branches.`);
  };

  // Save branch prices
  const handleSaveBranches = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const promises = branches.map((b) => {
        const val = branchInputs[b.locationId];
        const num = val && !Number.isNaN(Number(val)) ? Number(val) : 750;
        return setPtDropInPrice(b.locationId, num);
      });
      await Promise.all(promises);
      toast.success("Branch PT drop-in prices saved successfully!");
      onPriceUpdated?.();
      router.refresh();
      setOpen(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || "Failed to save branch prices");
    } finally {
      setSaving(false);
    }
  };

  // Save coach overrides
  const handleSaveCoaches = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const promises = coaches.map((c) => {
        const val = coachInputs[c.coachId]?.trim();
        const price =
          val && !Number.isNaN(Number(val)) && Number(val) >= 0
            ? Number(val)
            : null;
        return setPtCoachDropInPrice(c.coachId, price);
      });
      await Promise.all(promises);
      toast.success("Coach PT drop-in prices saved successfully!");
      onPriceUpdated?.();
      router.refresh();
      setOpen(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || "Failed to save coach prices");
    } finally {
      setSaving(false);
    }
  };

  const filteredCoaches = coaches.filter((c) =>
    c.coachName.toLowerCase().includes(coachSearch.toLowerCase().trim()),
  );

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personal Training Drop-In Pricing</DialogTitle>
            <DialogDescription>
              Configure the fixed drop-in fee for Personal Training sessions.
              Set base prices per branch and optionally specify custom rates for individual coaches.
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
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "branches" | "coaches")}
              className="space-y-4 pt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="branches" className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span>Branch Fixed Prices</span>
                </TabsTrigger>
                <TabsTrigger value="coaches" className="flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4" />
                  <span>Coach Overrides ({coaches.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* BRANCHES TAB */}
              <TabsContent value="branches" className="space-y-4">
                {/* Batch helper */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="text-xs text-muted-foreground">
                    Quickly set the same fixed price across all branches:
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 750"
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

                <form onSubmit={handleSaveBranches} className="space-y-4">
                  <div className="space-y-3">
                    {branches.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No branches found.
                      </p>
                    ) : (
                      branches.map((b) => (
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
                    <Button type="submit" disabled={saving || branches.length === 0}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save branch prices"
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* COACHES TAB */}
              <TabsContent value="coaches" className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Input
                    type="search"
                    placeholder="Search coach by name..."
                    value={coachSearch}
                    onChange={(e) => setCoachSearch(e.target.value)}
                    className="h-8 text-xs max-w-xs"
                  />
                  <span className="text-xs text-muted-foreground">
                    Leave blank to use the branch default price.
                  </span>
                </div>

                <form onSubmit={handleSaveCoaches} className="space-y-4">
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredCoaches.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No coaches found matching search.
                      </p>
                    ) : (
                      filteredCoaches.map((c) => {
                        const hasCustom = Boolean(coachInputs[c.coachId]);
                        return (
                          <div
                            key={c.coachId}
                            className="flex items-center justify-between gap-4 p-2.5 rounded-md border"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-none truncate">
                                {c.coachName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {hasCustom ? (
                                  <span className="text-primary font-medium">
                                    Custom rate: {coachInputs[c.coachId]} EGP
                                  </span>
                                ) : (
                                  "Uses branch default"
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Input
                                type="number"
                                min="0"
                                placeholder="Branch default"
                                value={coachInputs[c.coachId] ?? ""}
                                onChange={(e) =>
                                  setCoachInputs((prev) => ({
                                    ...prev,
                                    [c.coachId]: e.target.value,
                                  }))
                                }
                                className="w-28 text-right font-medium"
                              />
                              <span className="text-xs text-muted-foreground w-8">
                                EGP
                              </span>
                              {hasCustom && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Reset to branch default"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() =>
                                    setCoachInputs((prev) => ({
                                      ...prev,
                                      [c.coachId]: "",
                                    }))
                                  }
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
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
                    <Button type="submit" disabled={saving || coaches.length === 0}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save coach prices"
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
