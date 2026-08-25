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
import { Coach } from "@/components/ui/coaches/columns";

type CoachSearchSelectProps = {
  coaches: Coach[];
  value: string;
  onChange: (coachId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
};

export function CoachSearchSelect({
  coaches,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a coach",
  searchPlaceholder = "Search coaches...",
  className,
}: CoachSearchSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCoach = React.useMemo(() => {
    return coaches.find((c) => c._id === value);
  }, [coaches, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
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
            {selectedCoach ? selectedCoach.coachName : placeholder}
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
            <CommandEmpty>No coaches found.</CommandEmpty>
            <CommandGroup>
              {coaches.map((coach) => (
                <CommandItem
                  key={coach._id}
                  value={`${coach.coachName} ${coach.phoneNumber || ""}`}
                  onSelect={() => {
                    onChange(coach._id === value ? "" : coach._id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === coach._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate font-medium">{coach.coachName}</span>
                  {coach.phoneNumber && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {coach.phoneNumber}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
