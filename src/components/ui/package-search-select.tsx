"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Package } from "@/components/ui/packages/columns";
import { formatCatalogPackageLabel } from "@/lib/utils/open-gym";

type PackageSearchSelectProps = {
  packages: Package[];
  value: Package | null;
  onChange: (pkg: Package | null) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  getLabel?: (pkg: Package) => string;
  className?: string;
};

export function PackageSearchSelect({
  packages,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a package",
  searchPlaceholder = "Search packages...",
  getLabel = formatCatalogPackageLabel,
  className,
}: PackageSearchSelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left flex-1">
            {value ? getLabel(value) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command className="h-auto">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList style={{ maxHeight: "240px", overflowY: "auto" }}>
            <CommandEmpty>No packages found.</CommandEmpty>
            <CommandGroup>
              {packages.map((pkg) => {
                const label = getLabel(pkg);
                return (
                  <CommandItem
                    key={pkg._id}
                    value={`${pkg.name} ${label}`}
                    onSelect={() => {
                      onChange(pkg);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value?._id === pkg._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
