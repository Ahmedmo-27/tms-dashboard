"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLocations, Location } from "@/lib/data/locations";

interface OpenGymBranchSelectProps {
  value: string;
  onChange: (locationId: string) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Branch picker for open gym actions. This deployment does not assign a branch
 * to staff users, so the admin selects the target branch explicitly and the
 * chosen locationId is forwarded with every open gym request.
 */
export function OpenGymBranchSelect({
  value,
  onChange,
  disabled,
  label = "Branch",
}: OpenGymBranchSelectProps) {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    let active = true;
    getLocations()
      .then((locs) => {
        if (active) setLocations(locs);
      })
      .catch(() => {
        if (active) setLocations([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc._id} value={loc._id}>
              {loc.branchName}
              {loc.location ? ` — ${loc.location}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
