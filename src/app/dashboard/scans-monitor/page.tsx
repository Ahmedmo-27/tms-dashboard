export const dynamic = "force-dynamic";
import React from "react";
import { ScanContainer } from "@/components/ui/scans/scan-container";
import { getScheduledClasses } from "@/lib/data/schedule";
import {
  parseScans,
  parseDailyAttendance,
} from "@/lib/utils/parsers/scans-parser";
import { getDailyAttendance } from "@/lib/data/scans";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";
import { getPackages } from "@/lib/data/package";
import { getClasses } from "@/lib/data/class";
import { Class } from "@/components/ui/classes/columns";
import { formatInTimeZone } from "date-fns-tz";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; checkInsDate?: string; locationId?: string }>;
}) {
  let scans: any = [];
  let checkIns: any = [];
  let packages: any = [];
  let classes: Class[] = [];

  const params = await searchParams;
  const locationId = params.locationId;
  const todayCairo = formatInTimeZone(new Date(), "Africa/Cairo", "yyyy-MM-dd");
  const dateParam = params.date || todayCairo;
  const checkInsDateParam = params.checkInsDate || todayCairo;
  try {
    const [scheduledClasses, packagesData, classesData] = await Promise.all([
      getScheduledClasses(locationId, dateParam),
      getPackages(locationId),
      getClasses(locationId),
    ]);
    packages = packagesData;
    classes = classesData;
    if (scheduledClasses.length > 0) {
      scans = parseScans(scheduledClasses, dateParam);
    } else {
      scans = [];
    }
    const dailyAttendance = await getDailyAttendance(checkInsDateParam, locationId);
    if (dailyAttendance && dailyAttendance.length > 0) {
      checkIns = parseDailyAttendance(dailyAttendance);
    } else {
      checkIns = { pt: [], openGym: [] };
    }
    return (
      <div>
        <ScanContainer
          scans={scans}
          dailyAttendance={checkIns}
          packages={packages}
          classes={classes}
          initialDate={dateParam}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Qr Codes Unavailable"
          description="Unable to load qr codes due to network issues."
          showBackButton={false}
        />
      );
    } else if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
    return (
      <NetworkErrorPage
        title="Server Unavailable"
        description={error instanceof Error ? error.message : "Unable to load scans."}
        showBackButton={false}
      />
    );
  }
}
