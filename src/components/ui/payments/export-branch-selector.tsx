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
  className?: string;
}

export function ExportBranchSelector({
  locations,
  selectedIds,
  onChange,
  disabled,
  className,
}: ExportBranchSelectorProps) {
  if (locations.length <= 1) {
    return null;
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

      <div className="rounded-md border divide-y max-h-44 overflow-y-auto">
        {locations.map((location) => {
          const checked = selectedIds.includes(location._id);

          return (
            <label
              key={location._id}
              className="flex items-start gap-3 p-3 min-h-[44px] cursor-pointer hover:bg-muted/40"
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
        {selectedIds.length} of {locations.length} branch
        {locations.length === 1 ? "" : "es"} selected
      </p>
    </div>
  );
}
