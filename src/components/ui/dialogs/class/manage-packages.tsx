"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { MultiSelect } from "../../multiselect";
import { Class } from "../../classes/columns";
import { Package } from "../../packages/columns";
import { editPackage } from "@/lib/data/package";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ManagePackagesDialog({
  cls,
  packages,
  compact = false,
}: {
  cls: Class;
  packages: Package[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const packageNameMap = new Map(packages.map((p) => [p.name, p]));

  const initialSelectedNames = packages
    .filter((pkg) => pkg.opensClasses.some((c) => c?._id === cls._id))
    .map((pkg) => pkg.name);

  const [selectedNames, setSelectedNames] = useState<string[]>(initialSelectedNames);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setSelectedNames(initialSelectedNames);
    setErrorMessage(null);
    setOpen(true);
  };

  const handleSave = async () => {
    const initialSelectedIds = packages
      .filter((pkg) => pkg.opensClasses.some((c) => c._id === cls._id))
      .map((pkg) => pkg._id);

    const newSelectedIds = selectedNames
      .map((name) => packageNameMap.get(name)?._id)
      .filter((id): id is string => !!id);

    const added = newSelectedIds.filter((id) => !initialSelectedIds.includes(id));
    const removed = initialSelectedIds.filter((id) => !newSelectedIds.includes(id));

    if (added.length === 0 && removed.length === 0) {
      setOpen(false);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const addPatches = added.map((id) => {
      const pkg = packages.find((p) => p._id === id)!;
      return editPackage({
        _id: id,
        opensClasses: [...pkg.opensClasses.map((c) => c._id), cls._id],
      }).then(() => ({ id, name: pkg.name, success: true as const }))
        .catch(() => ({ id, name: pkg.name, success: false as const }));
    });

    const removePatches = removed.map((id) => {
      const pkg = packages.find((p) => p._id === id)!;
      return editPackage({
        _id: id,
        opensClasses: pkg.opensClasses
          .filter((c) => c._id !== cls._id)
          .map((c) => c._id),
      }).then(() => ({ id, name: pkg.name, success: true as const }))
        .catch(() => ({ id, name: pkg.name, success: false as const }));
    });

    const results = await Promise.all([...addPatches, ...removePatches]);
    const failed = results.filter((r) => !r.success);

    setIsSaving(false);
    router.refresh();

    if (failed.length > 0) {
      setErrorMessage(
        `Failed to update: ${failed.map((f) => f.name).join(", ")}`
      );
    } else {
      setOpen(false);
    }
  };

  const triggerButton = (
    <Button
      variant="outline"
      size={compact ? "icon" : "default"}
      className={compact ? "h-8 w-8 cursor-pointer shrink-0" : "w-full cursor-pointer"}
      onClick={handleOpen}
    >
      <Layers className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      {!compact && <span>Packages</span>}
      {compact && <span className="sr-only">Manage Packages</span>}
    </Button>
  );

  return (
    <div>
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
          <TooltipContent>Manage Packages</TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Manage Packages — {cls.title}
            </DialogTitle>
            <DialogDescription>
              Select which packages include this class
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <MultiSelect
              placeholder="Select packages..."
              options={packages.map((p) => p.name)}
              selected={selectedNames}
              onChange={setSelectedNames}
            />
            {errorMessage && (
              <p className="text-destructive text-sm">{errorMessage}</p>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
