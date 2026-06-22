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
  const [date, setDate] = React.useState<Date | undefined>(selectedDate);
  React.useEffect(() => {
    if (date) {
      handleDateChange?.(date.toString());
    }
  }, [date, handleDateChange]);

  React.useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
            "text-sm"
          )}
          disabled={disabled}
        >
          <CalendarIcon />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
        {date && date < new Date(new Date().setHours(0, 0, 0, 0)) && (
          <span className="text-xs text-yellow-500">
            Warning: Selected a past date
          </span>
        )}
      <PopoverContent
        className="w-auto p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
