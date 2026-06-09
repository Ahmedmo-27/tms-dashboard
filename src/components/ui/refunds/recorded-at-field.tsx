"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecordedAtField() {
  const [timestamp, setTimestamp] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-2">
      <Label htmlFor="recordedAt">Recorded at (auto)</Label>
      <Input
        id="recordedAt"
        readOnly
        value={format(timestamp, "dd MMM yyyy, HH:mm")}
        className="bg-muted/50"
      />
    </div>
  );
}
