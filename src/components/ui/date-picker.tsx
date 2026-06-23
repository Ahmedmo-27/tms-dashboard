"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { startOfDay } from "date-fns";


export function DatePicker({
  date,
  onSelect,
}: {
  date?: Date
  onSelect?: (date?: Date) => void
}) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={onSelect}
            initialFocus
            disabled={(date) => date < startOfDay(new Date())}
          />
    </div>
  )
}
