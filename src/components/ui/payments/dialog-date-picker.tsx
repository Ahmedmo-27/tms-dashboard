"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DialogDatePickerProps {
  className?: string;
  selectedDate?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
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

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}

      {/* Native picker: reliable on phones/tablets inside modals */}
      <Input
        type="date"
        aria-label={label ?? placeholder}
        value={date ? format(date, "yyyy-MM-dd") : ""}
        onChange={(event) => {
          const value = event.target.value;
          handleDateSelect(value ? parseDateInputValue(value) : undefined);
        }}
        className="min-h-[44px] w-full touch-manipulation text-base md:hidden"
      />

      {/*
        Portaled popover for desktop: dialog-safe popover (no portal) gets clipped
        by DialogContent's transform + overflow-hidden containing block. It is not
        modal — a modal popover inside a modal dialog leaves pointer-events: none
        on body and the trigger stops responding.
      */}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-expanded={open}
            className={cn(
              "hidden w-full justify-start text-left font-normal min-h-[40px] md:flex",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {date ? format(date, "PPP") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[70] w-auto p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={16}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            // Keep the parent dialog open when dismissing the calendar.
            event.preventDefault();
            onOpenChange?.(false);
          }}
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
  );
}
