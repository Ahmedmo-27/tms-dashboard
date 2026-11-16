"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CountdownTimerProps {
  initialSecondsRemaining: number;
  onHourReset?: () => void;
  slotHour: number;
}

export function CountdownTimer({
  initialSecondsRemaining,
  onHourReset,
  slotHour,
}: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsRemaining);

  useEffect(() => {
    setSecondsLeft(initialSecondsRemaining);
  }, [initialSecondsRemaining]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onHourReset) {
        onHourReset();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onHourReset) onHourReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onHourReset]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  // 3600 seconds in an hour
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((3600 - secondsLeft) / 3600) * 100))
  );

  const isNearingEnd = secondsLeft < 15 * 60; // Less than 15 mins left in hour

  // Format slot hour range (e.g. "03:00 PM – 04:00 PM")
  const formatHourSlot = (h: number) => {
    const startPeriod = h >= 12 ? "PM" : "AM";
    const startHour12 = h % 12 === 0 ? 12 : h % 12;
    const nextH = (h + 1) % 24;
    const endPeriod = nextH >= 12 ? "PM" : "AM";
    const endHour12 = nextH % 12 === 0 ? 12 : nextH % 12;
    return `${startHour12}:00 ${startPeriod} – ${endHour12}:00 ${endPeriod}`;
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary animate-pulse" />
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Current Inspection Window
            </div>
            <div className="text-sm font-semibold">
              {formatHourSlot(slotHour)}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            {isNearingEnd && (
              <AlertTriangle className="h-4 w-4 text-amber-500 animate-bounce" />
            )}
            <span
              className={`font-mono text-lg font-bold tracking-tight ${
                isNearingEnd ? "text-amber-500" : "text-foreground"
              }`}
            >
              {formattedTime}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            until next hourly reset
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Hour start (:00)</span>
          <span>{progressPercent}% elapsed</span>
          <span>Reset (:00)</span>
        </div>
      </div>
    </div>
  );
}
