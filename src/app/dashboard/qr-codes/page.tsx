export const dynamic = "force-dynamic";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import { QRCodesPage } from "@/components/ui/qr-codes/qr-codes-page";
import { NetworkError, UnauthorizedError, NotFoundError } from "@/core/api-error";
import { getScheduledClasses } from "@/lib/data/schedule";
import { getLocations } from "@/lib/data/locations";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";
import { formatInTimeZone } from "date-fns-tz";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; locationId?: string }>;
}) {
  try {
    const params = await searchParams;
    const locationId = params.locationId;
    const todayCairo = formatInTimeZone(new Date(), "Africa/Cairo", "yyyy-MM-dd");
    const dateParam = params.date || todayCairo;

    const [scheduledClasses, locations] = await Promise.all([
      getScheduledClasses(locationId, dateParam).catch((e) => {
        if (e instanceof NotFoundError) return [];
        throw e;
      }),
      getLocations().catch((e) => {
        if (e instanceof NotFoundError) return [];
        throw e;
      }),
    ]);

    return (
      <QRCodesPage
        locations={locations}
        scheduledClasses={scheduledClasses}
        initialDate={dateParam}
      />
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
    throw error;
  }
}
