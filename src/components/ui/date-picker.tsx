"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";


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
            disabled={(date) => date < new Date()}
          />
    </div>
  )
}
