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

export default async function Page({
  searchParams,
}: {
  searchParams: { date?: string; checkInsDate?: string };
}) {
  let scans: any = [];
  let checkIns: any = [];
  let packages: any = [];

  const params = await searchParams;
  const dateParam = params.date ? new Date(params.date) : new Date();
  const checkInsDateParam = params.checkInsDate
    ? new Date(params.checkInsDate)
    : new Date();
  try {
    const scheduledClasses = await getScheduledClasses();
    packages = await getPackages();     // Get packages
    if (scheduledClasses.length > 0) {
      scans = parseScans(scheduledClasses, dateParam);
    } else {
      scans = [];
    }
    const dailyAttendance = await getDailyAttendance(checkInsDateParam);
    if (dailyAttendance.length > 0) {
      checkIns = parseDailyAttendance(dailyAttendance);
    } else {
      checkIns = { pt: [], openGym: [] };
    }
    return (
      <div>
        <ScanContainer scans={scans} dailyAttendance={checkIns} packages={packages} />
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
  }
}
