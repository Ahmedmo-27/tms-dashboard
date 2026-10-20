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

export interface ClassOption {
  _id: string;
  title: string;
}

export interface ClassSearchSelectProps {
  classes: ClassOption[];
  value: string;
  onChange: (classId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  id?: string;
}

export function ClassSearchSelect({
  classes,
  value,
  onChange,
  disabled = false,
  placeholder = "Select class",
  searchPlaceholder = "Search class...",
  className,
  id,
}: ClassSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedClass = classes.find((c) => c._id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-10 justify-between font-normal",
            !selectedClass && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-left flex-1">
            {selectedClass ? selectedClass.title : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0"
        align="start"
        sideOffset={4}
      >
        <Command className="h-auto">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList style={{ maxHeight: "240px", overflowY: "auto" }}>
            <CommandEmpty>No class found.</CommandEmpty>
            <CommandGroup>
              {classes.map((cls) => {
                const isSelected = cls._id === value;
                return (
                  <CommandItem
                    key={cls._id}
                    value={cls.title}
                    onSelect={() => {
                      onChange(cls._id);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{cls.title}</span>
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
