export const dynamic = "force-dynamic";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import { QRCodesPage } from "@/components/ui/qr-codes/qr-codes-page";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import { getNextScheduledClasses } from "@/lib/data/schedule";
import { getLocations } from "@/lib/data/locations";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export default async function Page() {
  try {
    const [scheduledClasses, locations] = await Promise.all([
      getNextScheduledClasses(),
      getLocations(),
    ]);

    return (
      <QRCodesPage
        locations={locations}
        scheduledClasses={scheduledClasses}
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
  }
}
