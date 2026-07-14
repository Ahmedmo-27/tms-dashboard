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
import {
  NetworkError,
  NotFoundError,
  UnauthorizedError,
} from "@/core/api-error";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";
import { getPackages } from "@/lib/data/package";
import { getClasses } from "@/lib/data/class";
import { Class } from "@/components/ui/classes/columns";

function emptyOnNotFound<T>(fallback: T) {
  return (error: unknown): T => {
    if (error instanceof NotFoundError) return fallback;
    throw error;
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: { date?: string; checkInsDate?: string; locationId?: string };
}) {
  let scans: any = [];
  let checkIns: any = { pt: [], openGym: [] };
  let packages: any = [];
  let classes: Class[] = [];

  const params = await searchParams;
  const locationId = params.locationId;
  const dateParam = params.date ? new Date(params.date) : new Date();
  const checkInsDateParam = params.checkInsDate
    ? new Date(params.checkInsDate)
    : new Date();
  try {
    // Catalog class/package lists may 404 for a branch with sessions but no
    // Class.locations entry — Schedule works; don't blank Scans Monitor.
    const [scheduledClasses, packagesData, classesData] = await Promise.all([
      getScheduledClasses(locationId),
      getPackages().catch(emptyOnNotFound([])),
      getClasses().catch(emptyOnNotFound([])),
    ]);
    packages = packagesData;
    classes = classesData;
    scans =
      scheduledClasses.length > 0
        ? parseScans(scheduledClasses, dateParam)
        : [];
    const dailyAttendance = await getDailyAttendance(
      checkInsDateParam,
      locationId
    ).catch(emptyOnNotFound([]));
    checkIns =
      dailyAttendance.length > 0
        ? parseDailyAttendance(dailyAttendance)
        : { pt: [], openGym: [] };
    return (
      <div>
        <ScanContainer
          scans={scans}
          dailyAttendance={checkIns}
          packages={packages}
          classes={classes}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Scans Monitor Unavailable"
          description="Unable to load scans monitor due to network issues."
          showBackButton={false}
        />
      );
    }
    if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
    return (
      <NetworkErrorPage
        title="Scans Monitor Unavailable"
        description="Unable to load scans monitor. Please try again."
        showBackButton={false}
      />
    );
  }
}
