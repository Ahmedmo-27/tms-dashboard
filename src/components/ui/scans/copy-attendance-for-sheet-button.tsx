"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClassScan } from "@/components/ui/scans/class-container";
import {
  buildSheetClipboardText,
  isSheetCopyEligible,
  type MethodSheetMapping,
} from "@/lib/utils/copy-class-for-sheet";
import { toast } from "react-hot-toast";

type CopyAttendanceForSheetButtonProps = {
  scans: ClassScan[];
  mapMethod: (method: string) => MethodSheetMapping;
  classPrice?: string;
};

export function CopyAttendanceForSheetButton({
  scans,
  mapMethod,
  classPrice,
}: CopyAttendanceForSheetButtonProps) {
  const [open, setOpen] = useState(false);
  const eligibleScans = useMemo(
    () => scans.filter(isSheetCopyEligible),
    [scans]
  );
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    () => new Set()
  );

  const selectedCount = selectedIndexes.size;
  const allSelected =
    eligibleScans.length > 0 && selectedCount === eligibleScans.length;

  const resetSelection = () => {
    setSelectedIndexes(new Set());
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      resetSelection();
    }
  };

  const toggleIndex = (index: number, checked: boolean) => {
    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  const selectAll = () => resetSelection();
  const clearAll = () => setSelectedIndexes(new Set());

  const handleCopy = async () => {
    const selectedScans = eligibleScans.filter((_, index) =>
      selectedIndexes.has(index)
    );
    const sheetText = buildSheetClipboardText(
      selectedScans,
      mapMethod,
      classPrice
    );

    if (!sheetText) {
      toast.error("Select at least one member to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(sheetText);
      toast.success(
        selectedScans.length === 1
          ? "Copied 1 member for sheet"
          : `Copied ${selectedScans.length} members for sheet`
      );
      setOpen(false);
    } catch {
      toast.error("Failed to copy attendance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={eligibleScans.length === 0}
          className="whitespace-nowrap text-xs"
        >
          Copy attendance for sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy attendance for sheet</DialogTitle>
          <DialogDescription>
            Choose which check-ins to copy. Members still marked Will pay
            cannot be copied until they succeed or fail.
          </DialogDescription>
        </DialogHeader>

        {eligibleScans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No copyable check-ins yet.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Members</p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={selectAll}
                  disabled={allSelected}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={clearAll}
                  disabled={selectedCount === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[240px] rounded-md border">
              <div className="divide-y">
                {eligibleScans.map((scan, index) => {
                  const checked = selectedIndexes.has(index);
                  const mapped = mapMethod(scan.method);
                  const packageLabel =
                    mapped.kind === "dropin" ? "Drop in" : mapped.label;

                  return (
                    <label
                      key={`${scan.memberId ?? scan.member}-${scan.time}-${index}`}
                      className="flex items-start gap-3 p-3 min-h-[44px] cursor-pointer hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleIndex(index, value === true)
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {scan.member || "Unknown"}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {packageLabel || scan.method}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              {selectedCount} of {eligibleScans.length} selected
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCopy}
            disabled={selectedCount === 0}
          >
            Copy selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
