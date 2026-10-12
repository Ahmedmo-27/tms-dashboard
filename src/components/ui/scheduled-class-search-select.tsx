"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { format } from "date-fns";
import {
  Command,
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
import { ScheduledClass } from "@/components/ui/schedule/columns";

export type ScheduledClassSearchSelectProps = {
  classes: ScheduledClass[];
  value: string;
  onChange: (classId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  initialLimit?: number;
  searchLimit?: number;
  allowClear?: boolean;
  showSlots?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
};

export function formatScheduledClassLabel(
  cls: ScheduledClass,
  options?: { showSlots?: boolean }
): string {
  let timeStr = "";
  if (cls.startTime) {
    try {
      const d = new Date(cls.startTime);
      if (!isNaN(d.getTime())) {
        timeStr = format(d, "HH:mm");
      }
    } catch {
      timeStr = "";
    }
  }

  const name = cls.className || "Class";
  const timePart = timeStr ? ` (${timeStr})` : "";
  const coachPart = cls.coachName ? ` - ${cls.coachName}` : "";
  const slotsPart =
    options?.showSlots && typeof cls.availableSlots === "number"
      ? ` · ${Math.max(0, cls.availableSlots)} slots`
      : "";

  return `${name}${timePart}${coachPart}${slotsPart}`;
}

function matchesClassQuery(cls: ScheduledClass, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const name = (cls.className || "").toLowerCase();
  const coach = (cls.coachName || "").toLowerCase();
  const category = (cls.category || "").toLowerCase();

  if (name.includes(query) || coach.includes(query) || category.includes(query)) {
    return true;
  }

  if (cls.startTime) {
    try {
      const d = new Date(cls.startTime);
      if (!isNaN(d.getTime())) {
        const time24 = format(d, "HH:mm").toLowerCase();
        const time24Short = format(d, "H:mm").toLowerCase();
        const time12 = format(d, "h:mm a").toLowerCase();
        const time12NoSpace = format(d, "h:mma").toLowerCase();
        if (
          time24.includes(query) ||
          time24Short.includes(query) ||
          time12.includes(query) ||
          time12NoSpace.includes(query)
        ) {
          return true;
        }
      }
    } catch {
      // ignore invalid dates
    }
  }

  return false;
}

export function ScheduledClassSearchSelect({
  classes,
  value,
  onChange,
  disabled = false,
  placeholder = "Choose a scheduled class...",
  searchPlaceholder = "Search class by name, coach, time...",
  initialLimit = 5,
  searchLimit = 8,
  allowClear = false,
  showSlots = false,
  className,
  triggerClassName,
  id,
}: ScheduledClassSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedClass = React.useMemo(() => {
    return classes.find((c) => c._id === value) || null;
  }, [classes, value]);

  const { visibleClasses, totalMatches, isSearching } = React.useMemo(() => {
    const query = searchQuery.trim();

    if (!query) {
      // Don't show all classes at once: show currently selected class first, then up to initialLimit - 1 other classes
      const selected = classes.find((c) => c._id === value);
      const limit = selected ? Math.max(1, initialLimit - 1) : initialLimit;
      const others = classes
        .filter((c) => c._id !== value)
        .slice(0, limit);
      const list = selected ? [selected, ...others] : others;

      return {
        visibleClasses: list,
        totalMatches: classes.length,
        isSearching: false,
      };
    }

    const matches = classes.filter((cls) => matchesClassQuery(cls, query));

    return {
      visibleClasses: matches.slice(0, searchLimit),
      totalMatches: matches.length,
      isSearching: true,
    };
  }, [classes, value, searchQuery, initialLimit, searchLimit]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between items-center h-9 px-3 text-left font-normal cursor-pointer",
            !value && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="truncate flex-1">
            {selectedClass
              ? formatScheduledClassLabel(selectedClass, { showSlots })
              : placeholder}
          </span>
          {allowClear && selectedClass && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selected class"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange("");
                }
              }}
              className="mr-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "z-[100] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] sm:max-w-[480px] p-0",
          className
        )}
        align="start"
        sideOffset={4}
        onInteractOutside={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
      >
        <Command shouldFilter={false} className="h-auto">
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList style={{ maxHeight: "220px", overflowY: "auto" }}>
            {visibleClasses.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {isSearching ? (
                  <>No classes found matching &ldquo;{searchQuery}&rdquo;</>
                ) : (
                  "No scheduled classes available"
                )}
              </div>
            ) : null}
            <CommandGroup>
              {visibleClasses.map((cls) => {
                const isSelected = cls._id === value;
                const label = formatScheduledClassLabel(cls, { showSlots });

                return (
                  <CommandItem
                    key={cls._id}
                    value={cls._id || ""}
                    onSelect={() => {
                      onChange(cls._id || "");
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="cursor-pointer py-2 px-2.5 flex items-center"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                    <span className="truncate text-sm font-normal">
                      {label}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {isSearching && totalMatches > visibleClasses.length ? (
            <div className="border-t bg-muted/20 px-3 py-1.5 text-center text-xs text-muted-foreground">
              Showing {visibleClasses.length} of {totalMatches} matches · Refine search to see more
            </div>
          ) : !isSearching && classes.length > visibleClasses.length ? (
            <div className="border-t bg-muted/20 px-3 py-1.5 text-center text-xs text-muted-foreground">
              Showing {visibleClasses.length} of {classes.length} classes · Search to find more
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
