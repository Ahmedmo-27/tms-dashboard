"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OpenGymBranchSelect } from "@/components/ui/open-gym/branch-select";
import { Package } from "@/components/ui/packages/columns";
import {
  createOpenGymPackage,
  deleteOpenGymPackage,
  getOpenGymDropInPrices,
  setOpenGymDropInPrice,
  updateOpenGymPackage,
  type OpenGymBranchPrice,
} from "@/lib/data/open-gym";
import {
  daysToDuration,
  durationToDays,
  DurationUnit,
  formatDurationLabel,
} from "@/lib/utils/open-gym-duration";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type PackageRow = {
  key: string;
  pkgId?: string;
  name: string;
  durationValue: string;
  durationUnit: DurationUnit;
  price: string;
};

function packageLocationId(pkg: Package): string {
  if (!pkg.locationId) return "";
  return typeof pkg.locationId === "string"
    ? pkg.locationId
    : pkg.locationId._id ?? "";
}

function newPackageRow(): PackageRow {
  return {
    key: `new-${crypto.randomUUID()}`,
    name: "",
    durationValue: "1",
    durationUnit: "weeks",
    price: "",
  };
}

function packageToRow(pkg: Package): PackageRow {
  const { value, unit } = daysToDuration(pkg.expiryPeriod);
  return {
    key: pkg._id,
    pkgId: pkg._id,
    name: pkg.name,
    durationValue: value,
    durationUnit: unit,
    price: String(pkg.price ?? ""),
  };
}

function isPositiveNumber(value: string): boolean {
  const parsed = Number(value);
  return value !== "" && Number.isFinite(parsed) && parsed > 0;
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
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [deletedPkgIds, setDeletedPkgIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const branchPackages = useMemo(() => {
    if (!locationId) return [];
    return packages
      .filter(
        (pkg) =>
          pkg.category === "OPEN_GYM" &&
          packageLocationId(pkg) === locationId,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [locationId, packages]);

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

  useEffect(() => {
    if (!locationId) {
      setDropInPrice("");
      setRows([]);
      setDeletedPkgIds([]);
      return;
    }

    const branch = prices.find((p) => p.locationId === locationId);
    setDropInPrice(branch?.price != null ? String(branch.price) : "");
    setRows(
      branchPackages.length > 0
        ? branchPackages.map(packageToRow)
        : [newPackageRow()],
    );
    setDeletedPkgIds([]);
  }, [locationId, prices, branchPackages]);

  const updateRow = (
    key: string,
    field: keyof Omit<PackageRow, "key" | "pkgId">,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, newPackageRow()]);
  };

  const removeRow = (row: PackageRow) => {
    if (row.pkgId) {
      setDeletedPkgIds((prev) =>
        prev.includes(row.pkgId!) ? prev : [...prev, row.pkgId!],
      );
    }
    setRows((prev) => {
      const next = prev.filter((item) => item.key !== row.key);
      return next.length > 0 ? next : [newPackageRow()];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) {
      toast.error("Select a branch first");
      return;
    }

    const rowsToSave = rows.filter(
      (row) =>
        row.name.trim().length > 0 &&
        isPositiveNumber(row.durationValue) &&
        isPositiveNumber(row.price) &&
        (!row.pkgId || !deletedPkgIds.includes(row.pkgId)),
    );

    if (!isPositiveNumber(dropInPrice) && rowsToSave.length === 0 && deletedPkgIds.length === 0) {
      toast.error("Add at least one package or drop-in price");
      return;
    }

    for (const row of rowsToSave) {
      const expiryPeriod = durationToDays(
        Number(row.durationValue),
        row.durationUnit,
      );
      if (expiryPeriod < 1) {
        toast.error(`Invalid duration for "${row.name || "package"}"`);
        return;
      }
    }

    setSaving(true);
    try {
      const tasks: Promise<unknown>[] = [];

      if (isPositiveNumber(dropInPrice)) {
        tasks.push(setOpenGymDropInPrice(locationId, Number(dropInPrice)));
      }

      for (const pkgId of deletedPkgIds) {
        tasks.push(deleteOpenGymPackage(pkgId));
      }

      for (const row of rowsToSave) {
        const payload = {
          name: row.name.trim(),
          price: Number(row.price),
          expiryPeriod: durationToDays(
            Number(row.durationValue),
            row.durationUnit,
          ),
          locationId,
        };

        if (row.pkgId) {
          tasks.push(updateOpenGymPackage({ pkgId: row.pkgId, ...payload }));
        } else {
          tasks.push(createOpenGymPackage(payload));
        }
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Open gym pricing</DialogTitle>
            <DialogDescription>
              Choose a branch, then create as many open gym packages as you
              need. Each package has its own name, duration (weeks or months),
              and price.
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

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Packages</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  disabled={!locationId}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add package
                </Button>
              </div>

              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Select a branch to manage packages.
                </p>
              ) : (
                rows.map((row) => {
                  const durationPreview = isPositiveNumber(row.durationValue)
                    ? formatDurationLabel(
                        Number(row.durationValue),
                        row.durationUnit,
                      )
                    : null;

                  return (
                    <div
                      key={row.key}
                      className="rounded-md border p-3 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">
                            {row.pkgId ? "Existing package" : "New package"}
                          </p>
                          {durationPreview ? (
                            <p className="text-xs text-muted-foreground">
                              Duration: {durationPreview}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row)}
                          disabled={!locationId}
                          aria-label="Remove package"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs text-muted-foreground">
                            Package name
                          </Label>
                          <Input
                            value={row.name}
                            onChange={(e) =>
                              updateRow(row.key, "name", e.target.value)
                            }
                            placeholder="e.g. Open Gym 2 Months — Maadi"
                            disabled={!locationId}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Duration
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={row.durationValue}
                              onChange={(e) =>
                                updateRow(
                                  row.key,
                                  "durationValue",
                                  e.target.value,
                                )
                              }
                              disabled={!locationId}
                            />
                            <Select
                              value={row.durationUnit}
                              onValueChange={(value: DurationUnit) =>
                                updateRow(row.key, "durationUnit", value)
                              }
                              disabled={!locationId}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weeks">Weeks</SelectItem>
                                <SelectItem value="months">Months</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Price (EGP)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={row.price}
                            onChange={(e) =>
                              updateRow(row.key, "price", e.target.value)
                            }
                            placeholder="0"
                            disabled={!locationId}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
