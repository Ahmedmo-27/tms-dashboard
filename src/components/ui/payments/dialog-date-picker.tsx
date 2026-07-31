"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover-dialog";

interface DialogDatePickerProps {
  className?: string;
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DialogDatePicker({
  className,
  selectedDate,
  onDateChange,
  placeholder = "Pick a date",
  label,
  open = false,
  onOpenChange,
}: DialogDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(selectedDate);

  React.useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    onDateChange?.(newDate);
    onOpenChange?.(false);
  };

  const triggerLabel = date ? format(date, "PPP") : placeholder;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}

      {/* Mobile: tap to expand inline calendar */}
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          aria-expanded={open}
          onClick={() => onOpenChange?.(!open)}
          className={cn(
            "w-full justify-start text-left font-normal min-h-[44px]",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{triggerLabel}</span>
        </Button>

        {open && (
          <div className="mt-2 flex justify-center rounded-md border bg-background p-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md"
            />
          </div>
        )}
      </div>

      {/* Desktop: calendar opens in popover on click */}
      <div className="hidden md:block">
        <Popover modal open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-expanded={open}
              className={cn(
                "w-full justify-start text-left font-normal min-h-[40px]",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{triggerLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// Keep parseDateInputValue exported for tests if needed - actually not needed, remove unused
