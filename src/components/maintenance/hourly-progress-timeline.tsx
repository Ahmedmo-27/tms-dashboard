"use client";

import React from "react";
import { MaintenanceLogEntry } from "@/lib/data/maintenance";

interface HourlyProgressTimelineProps {
  timelineHours: number[];
  logs: MaintenanceLogEntry[];
  currentCairoHour: number;
  isToday: boolean;
  onSelectHour?: (hour: number) => void;
  selectedHour?: number | null;
}

function formatHour12(h: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}

export function HourlyProgressTimeline({
  timelineHours,
  logs,
  currentCairoHour,
  isToday,
  onSelectHour,
  selectedHour,
}: HourlyProgressTimelineProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Today&apos;s Hourly Timeline</h4>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Done (4/4)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Incomplete
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Missed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border border-primary bg-primary/20" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-muted" /> Upcoming
          </span>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-17 gap-1.5 pt-1">
        {timelineHours.map((hour) => {
          const log = logs.find((l) => l.slotHour === hour);
          const isCurrent = isToday && hour === currentCairoHour;
          const isPast = !isToday || hour < currentCairoHour;
          const isFuture = isToday && hour > currentCairoHour;

          let statusClass = "bg-muted text-muted-foreground hover:bg-muted/80";
          let label = "Upcoming";

          if (log?.overallStatus === "completed") {
            statusClass =
              "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm";
            label = "Completed (4/4)";
          } else if (log && log.items.filter((i) => i.isCompleted).length > 0) {
            statusClass = "bg-amber-500 text-white hover:bg-amber-600 shadow-sm";
            label = `Partial (${log.items.filter((i) => i.isCompleted).length}/4)`;
          } else if (isPast) {
            statusClass = "bg-rose-500 text-white hover:bg-rose-600 shadow-sm";
            label = "Missed";
          } else if (isCurrent) {
            statusClass =
              "border-2 border-primary bg-primary/10 text-primary font-bold";
            label = "Current Hour";
          }

          const isSelected = selectedHour === hour;

          return (
            <button
              key={hour}
              type="button"
              onClick={() => onSelectHour && onSelectHour(hour)}
              title={`${formatHour12(hour)} – ${label}`}
              className={`flex flex-col items-center justify-center rounded-lg py-2 transition-all cursor-pointer ${statusClass} ${
                isSelected ? "ring-2 ring-primary ring-offset-2 scale-105" : ""
              }`}
            >
              <span className="font-mono text-xs whitespace-nowrap">
                {formatHour12(hour)}
              </span>
              <span className="text-[9px] mt-0.5 opacity-90 truncate max-w-full px-0.5">
                {log?.overallStatus === "completed"
                  ? "✓"
                  : isPast
                  ? "✗"
                  : isCurrent
                  ? "Now"
                  : "–"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
