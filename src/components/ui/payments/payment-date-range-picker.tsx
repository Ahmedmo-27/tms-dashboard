"use client";

import * as React from "react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  isSameDay,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarIcon, Check } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const CAIRO_TZ = "Africa/Cairo";

export interface PaymentDateRangePickerProps {
  className?: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
}

type Preset = {
  label: string;
  getRange: () => DateRange;
};

export function PaymentDateRangePicker({
  className,
  dateRange,
  onDateRangeChange,
  placeholder = "Pick a period",
}: PaymentDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(
    dateRange
  );

  React.useEffect(() => {
    setTempRange(dateRange);
  }, [dateRange, open]);

  const presets: Preset[] = React.useMemo(() => {
    const cairoNow = toZonedTime(new Date(), CAIRO_TZ);

    return [
      {
        label: "Today",
        getRange: () => ({
          from: cairoNow,
          to: cairoNow,
        }),
      },
      {
        label: "Yesterday",
        getRange: () => {
          const y = subDays(cairoNow, 1);
          return { from: y, to: y };
        },
      },
      {
        label: "Last 7 Days",
        getRange: () => ({
          from: subDays(cairoNow, 6),
          to: cairoNow,
        }),
      },
      {
        label: "Last 30 Days",
        getRange: () => ({
          from: subDays(cairoNow, 29),
          to: cairoNow,
        }),
      },
      {
        label: "This Month",
        getRange: () => ({
          from: startOfMonth(cairoNow),
          to: endOfMonth(cairoNow),
        }),
      },
      {
        label: "Last Month",
        getRange: () => {
          const lastMonth = subMonths(cairoNow, 1);
          return {
            from: startOfMonth(lastMonth),
            to: endOfMonth(lastMonth),
          };
        },
      },
    ];
  }, []);

  const isPresetActive = (preset: Preset) => {
    if (!tempRange?.from) return false;
    const r = preset.getRange();
    if (!r.from) return false;
    if (!isSameDay(tempRange.from, r.from)) return false;
    if (tempRange.to && r.to) {
      return isSameDay(tempRange.to, r.to);
    }
    return !tempRange.to && !r.to;
  };

  const handlePresetSelect = (preset: Preset) => {
    const newRange = preset.getRange();
    setTempRange(newRange);
    onDateRangeChange?.(newRange);
    setOpen(false);
  };

  const handleApply = () => {
    if (tempRange?.from) {
      const finalRange: DateRange = {
        from: tempRange.from,
        to: tempRange.to ?? tempRange.from,
      };
      onDateRangeChange?.(finalRange);
    } else {
      onDateRangeChange?.(undefined);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setTempRange(dateRange);
    setOpen(false);
  };

  const displayText = React.useMemo(() => {
    if (!dateRange?.from) return placeholder;

    const fromText = format(dateRange.from, "MMM dd, yyyy");
    if (!dateRange.to || isSameDay(dateRange.from, dateRange.to)) {
      return fromText;
    }
    const toText = format(dateRange.to, "MMM dd, yyyy");
    return `${fromText} – ${toText}`;
  }, [dateRange, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-h-[40px] px-3",
            !dateRange?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg border rounded-lg"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x">
          {/* Quick Presets list */}
          <div className="flex flex-col p-2 gap-1 sm:w-36 bg-muted/20">
            <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Presets
            </span>
            {presets.map((preset) => {
              const active = isPresetActive(preset);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-left transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    active && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <span>{preset.label}</span>
                  {active && <Check className="h-3 w-3 text-primary" />}
                </button>
              );
            })}
          </div>

          {/* Calendar Range Selection */}
          <div className="flex flex-col">
            <div className="p-1">
              <Calendar
                mode="range"
                selected={tempRange}
                onSelect={setTempRange}
                numberOfMonths={2}
                initialFocus
                className="rounded-md"
              />
            </div>

            {/* Footer with summary and actions */}
            <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 bg-muted/20">
              <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                {tempRange?.from ? (
                  <>
                    <span className="font-medium text-foreground">
                      {format(tempRange.from, "MMM dd, yyyy")}
                    </span>
                    {tempRange.to && !isSameDay(tempRange.from, tempRange.to) && (
                      <>
                        {" "}–{" "}
                        <span className="font-medium text-foreground">
                          {format(tempRange.to, "MMM dd, yyyy")}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  "Select a date range"
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 text-xs px-2.5"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!tempRange?.from}
                  className="h-8 text-xs px-3"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
