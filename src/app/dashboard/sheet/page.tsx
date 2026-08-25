export const dynamic = "force-dynamic";

import { DailySheetContainer } from "@/components/ui/daily-sheet/daily-sheet-container";
import { getSheetDay } from "@/lib/data/daily-sheet";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";
import { formatInTimeZone } from "date-fns-tz";

function sheetDateParam(raw?: string): string {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  const parsed = raw ? new Date(raw) : new Date();
  const base = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return formatInTimeZone(base, "Africa/Cairo", "yyyy-MM-dd");
}

export default async function SheetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; locationId?: string }>;
}) {
  const params = await searchParams;
  const date = sheetDateParam(params.date);
  const locationId = params.locationId;

  try {
    const day = await getSheetDay(date, locationId);
    return (
      <DailySheetContainer
        key={`${date}:${locationId ?? "all"}`}
        initialDay={day}
        initialDate={date}
        locationId={locationId}
      />
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Sheet Unavailable"
          description="Unable to load the daily sheet due to network issues."
          showBackButton={false}
        />
      );
    }
    if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
    throw error;
  }
}
