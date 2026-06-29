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
import { OpenGymBranchSelect } from "@/components/ui/open-gym/branch-select";
import { Package } from "@/components/ui/packages/columns";
import {
  getOpenGymDropInPrices,
  setOpenGymDropInPrice,
  upsertOpenGymPackage,
  type OpenGymBranchPrice,
} from "@/lib/data/open-gym";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

function packageLocationId(pkg: Package): string {
  if (!pkg.locationId) return "";
  return typeof pkg.locationId === "string"
    ? pkg.locationId
    : pkg.locationId._id ?? "";
}

function findBranchPackage(
  packages: Package[],
  locationId: string,
  renewalPeriod: "WEEKLY" | "MONTHLY",
): Package | undefined {
  return packages.find(
    (p) =>
      p.category === "OPEN_GYM" &&
      p.renewalPeriod === renewalPeriod &&
      packageLocationId(p) === locationId,
  );
}

export function OpenGymPricingDialog({
  packages = [],
  triggerLabel = "Open gym pricing",
}: {
  packages?: Package[];
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prices, setPrices] = useState<OpenGymBranchPrice[]>([]);
  const [locationId, setLocationId] = useState("");
  const [dropInPrice, setDropInPrice] = useState("");
  const [weeklyPrice, setWeeklyPrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const weeklyPkg = locationId
    ? findBranchPackage(packages, locationId, "WEEKLY")
    : undefined;
  const monthlyPkg = locationId
    ? findBranchPackage(packages, locationId, "MONTHLY")
    : undefined;

  const loadPrices = async () => {
    try {
      setPrices(await getOpenGymDropInPrices());
    } catch {
      setPrices([]);
    }
  };

  useEffect(() => {
    if (open) loadPrices();
  }, [open]);

  // Pre-fill all fields for the selected branch.
  useEffect(() => {
    if (!locationId) {
      setDropInPrice("");
      setWeeklyPrice("");
      setMonthlyPrice("");
      return;
    }
    const branch = prices.find((p) => p.locationId === locationId);
    setDropInPrice(branch?.price != null ? String(branch.price) : "");
    setWeeklyPrice(weeklyPkg?.price != null ? String(weeklyPkg.price) : "");
    setMonthlyPrice(monthlyPkg?.price != null ? String(monthlyPkg.price) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, prices]);

  const isNum = (v: string) => v !== "" && !Number.isNaN(Number(v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) {
      toast.error("Select a branch first");
      return;
    }
    if (!isNum(dropInPrice) && !isNum(weeklyPrice) && !isNum(monthlyPrice)) {
      toast.error("Enter at least one price");
      return;
    }

    const branch = prices.find((p) => p.locationId === locationId);
    const branchName = branch?.branchName ?? "Branch";

    setSaving(true);
    try {
      const tasks: Promise<unknown>[] = [];

      if (isNum(dropInPrice)) {
        tasks.push(setOpenGymDropInPrice(locationId, Number(dropInPrice)));
      }
      if (isNum(weeklyPrice)) {
        tasks.push(
          upsertOpenGymPackage({
            pkgId: weeklyPkg?._id,
            name: `Open Gym Weekly — ${branchName}`,
            price: Number(weeklyPrice),
            renewalPeriod: "WEEKLY",
            locationId,
          }),
        );
      }
      if (isNum(monthlyPrice)) {
        tasks.push(
          upsertOpenGymPackage({
            pkgId: monthlyPkg?._id,
            name: `Open Gym Monthly — ${branchName}`,
            price: Number(monthlyPrice),
            renewalPeriod: "MONTHLY",
            locationId,
          }),
        );
      }

      await Promise.all(tasks);
      toast.success("Open gym pricing saved");
      await loadPrices();
      router.refresh();
      setOpen(false);
    } catch {
      toast.error("Failed to save open gym pricing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Open gym pricing</DialogTitle>
            <DialogDescription>
              Choose a branch, then set its drop-in price and weekly / monthly
              package prices. Saving creates the packages for that branch (or
              updates them if they already exist).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <OpenGymBranchSelect value={locationId} onChange={setLocationId} />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Drop-in price (EGP)</Label>
              <Input
                type="number"
                min={0}
                value={dropInPrice}
                onChange={(e) => setDropInPrice(e.target.value)}
                placeholder="Single visit"
                disabled={!locationId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Weekly price (EGP)
                  {weeklyPkg ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (update)
                    </span>
                  ) : null}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={weeklyPrice}
                  onChange={(e) => setWeeklyPrice(e.target.value)}
                  placeholder="7 days"
                  disabled={!locationId}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Monthly price (EGP)
                  {monthlyPkg ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (update)
                    </span>
                  ) : null}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="30 days"
                  disabled={!locationId}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!locationId || saving}>
                {saving ? "Saving…" : "Save open gym pricing"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
