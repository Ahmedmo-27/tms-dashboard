"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import QRTemplateGenerator from "@/components/ui/qrcode-template";
import SpaceQRCode from "@/components/ui/space-qrcode";
import type { Location } from "@/lib/data/locations";
import type { ScheduledClass } from "@/components/ui/schedule/columns";

interface QRCodesPageProps {
  locations: Location[];
  scheduledClasses: ScheduledClass[];
}

export function QRCodesPage({
  locations,
  scheduledClasses,
}: QRCodesPageProps) {
  const [location, setLocation] = useState<string>(
    locations[0]?.branchName ?? ""
  );

  const selectedLocation =
    locations.find((loc) => loc.branchName === location) ?? locations[0];

  const selectedLocationId = selectedLocation?._id ?? "";

  const todaysClasses = scheduledClasses.filter((cls) => {
    const clsDate = new Date(cls.startTime).toLocaleDateString();
    return clsDate === new Date().toLocaleDateString();
  });

  const filteredClasses = todaysClasses.filter((cls) => {
    const locationMatch =
      cls.locationId === selectedLocationId || cls.location === location;
    return locationMatch;
  });

  if (locations.length === 0) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          No locations available. Add a branch before generating QR codes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="max-w-sm space-y-2">
        <Label className="text-sm font-medium">Location</Label>
        <Select
          name="location"
          value={location}
          onValueChange={(value) => setLocation(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem
                key={loc._id}
                value={loc.branchName}
                className="hover:bg-accent"
              >
                {loc.branchName}
                {loc.location ? ` — ${loc.location}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">Static QR Codes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {selectedLocation && (
            <SpaceQRCode
              key={selectedLocation._id}
              locationId={selectedLocation._id}
              branchName={selectedLocation.branchName}
            />
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">
          Today&apos;s Classes — {selectedLocation?.branchName}
        </h2>
        {filteredClasses.length === 0 ? (
          <p className="text-muted-foreground">
            No classes scheduled for this location today.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClasses.map((cls) => (
              <QRTemplateGenerator key={cls._id} scls={cls} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
