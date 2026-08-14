"use client";

import { Fragment } from "react";
import QRTemplateGenerator from "@/components/ui/qrcode-template";
import SpaceQRCode from "@/components/ui/space-qrcode";
import type { Location } from "@/lib/data/locations";
import type { ScheduledClass } from "@/components/ui/schedule/columns";
import { useBranchContext } from "@/lib/hooks/use-branch-context";

interface QRCodesPageProps {
  locations: Location[];
  scheduledClasses: ScheduledClass[];
}

export function QRCodesPage({
  locations,
  scheduledClasses,
}: QRCodesPageProps) {
  const { effectiveLocationId } = useBranchContext();

  const visibleLocations = effectiveLocationId
    ? locations.filter((loc) => loc._id === effectiveLocationId)
    : locations;

  const todaysClasses = scheduledClasses.filter((cls) => {
    const clsDate = new Date(cls.startTime).toLocaleDateString();
    return clsDate === new Date().toLocaleDateString();
  });

  const visibleLocationIds = new Set(visibleLocations.map((l) => l._id));
  const visibleBranchNames = new Set(visibleLocations.map((l) => l.branchName));

  const filteredClasses = todaysClasses.filter((cls) => {
    return (
      (cls.locationId && visibleLocationIds.has(cls.locationId)) ||
      (cls.location && visibleBranchNames.has(cls.location))
    );
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
    <div className="grid gap-8 p-6 lg:grid-cols-2">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Static QR codes</h2>
          <p className="text-sm text-muted-foreground">
            Open gym and personal training check-in codes
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleLocations.map((loc) => (
            <Fragment key={loc._id}>
              <SpaceQRCode
                locationId={loc._id}
                branchName={loc.branchName}
                kind="openGym"
              />
              <SpaceQRCode
                locationId={loc._id}
                branchName={loc.branchName}
                kind="pt"
              />
            </Fragment>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Today&apos;s classes
            {visibleLocations.length === 1
              ? ` — ${visibleLocations[0].branchName}`
              : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Print today&apos;s class check-in codes
          </p>
        </div>
        {filteredClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No classes scheduled for this location today.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredClasses.map((cls) => (
              <QRTemplateGenerator key={cls._id} scls={cls} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
