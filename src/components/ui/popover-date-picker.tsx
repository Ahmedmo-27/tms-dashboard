"use client";

import * as React from "react";
import { format, isSameDay, startOfDay } from "date-fns";
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

function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function PopoverDatePicker({
  className,
  handleDateChange,
  selectedDate,
  disabled,
}: {
  className?: string;
  handleDateChange?: (date: string) => void;
  selectedDate?: Date;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(selectedDate);

  React.useEffect(() => {
    if (selectedDate === undefined) {
      setDate(undefined);
      return;
    }

    setDate((current) => {
      if (current && isSameDay(current, selectedDate)) {
        return current;
      }
      return selectedDate;
    });
  }, [selectedDate?.getTime()]);

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setOpen(false);
    if (newDate) {
      handleDateChange?.(newDate.toISOString());
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {/* Native picker for touch devices/screens */}
      <Input
        type="date"
        disabled={disabled}
        value={date ? format(date, "yyyy-MM-dd") : ""}
        onChange={(event) => {
          const value = event.target.value;
          if (value) {
            const parsed = parseDateInputValue(value);
            handleSelect(parsed);
          } else {
            setDate(undefined);
          }
        }}
        className="min-h-[40px] w-full touch-manipulation text-sm md:hidden"
      />

      {/* Portaled modal popover for desktop */}
      <Popover modal={true} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={"outline"}
            className={cn(
              "hidden w-full justify-start text-left font-normal min-h-[40px] md:flex",
              !date && "text-muted-foreground",
              "text-sm"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        {date && date < startOfDay(new Date()) && (
          <span className="text-xs text-yellow-500 block">
            Warning: Selected a past date
          </span>
        )}
        <PopoverContent
          className="z-[70] w-auto p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={16}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
