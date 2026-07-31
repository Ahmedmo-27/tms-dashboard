"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Location } from "@/lib/data/locations";
import { cn } from "@/lib/utils";

interface ExportBranchSelectorProps {
  locations: Location[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ExportBranchSelector({
  locations,
  selectedIds,
  onChange,
  disabled,
  isLoading = false,
  className,
}: ExportBranchSelectorProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-sm font-medium">Branches</p>
        <div className="rounded-md border px-3 py-4 text-sm text-muted-foreground">
          Loading branches…
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-sm font-medium">Branches</p>
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-4 text-sm text-destructive">
          Could not load branches. Close and try again.
        </div>
      </div>
    );
  }

  if (locations.length === 1) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-sm font-medium">Branch</p>
        <div className="rounded-md border bg-muted/40 px-3 py-3 text-sm">
          {locations[0].branchName}
        </div>
      </div>
    );
  }

  const toggleBranch = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, id]);
      return;
    }
    onChange(selectedIds.filter((branchId) => branchId !== id));
  };

  const selectAll = () => onChange(locations.map((location) => location._id));
  const clearAll = () => onChange([]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Branches</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={selectAll}
            disabled={disabled}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={clearAll}
            disabled={disabled}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Nested max-height scroll fights the dialog body on mobile; allow full list there */}
      <div className="rounded-md border divide-y sm:max-h-40 sm:overflow-y-auto sm:overscroll-contain">
        {locations.map((location) => {
          const checked = selectedIds.includes(location._id);

          return (
            <label
              key={location._id}
              className="flex items-start gap-3 p-3 min-h-[44px] cursor-pointer touch-manipulation hover:bg-muted/40"
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(value) => toggleBranch(location._id, value === true)}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{location.branchName}</span>
                {location.location && (
                  <span className="block text-xs text-muted-foreground truncate">
                    {location.location}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedIds.length} of {locations.length} branches selected
      </p>
    </div>
  );
}
