export const dynamic = "force-dynamic";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import QRTemplateGenerator from "@/components/ui/qrcode-template";
import SpaceQRCode from "@/components/ui/space-qrcode";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import { getNextScheduledClasses } from "@/lib/data/schedule";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export default async function Page() {
  try {
    const scheduledClasses = await getNextScheduledClasses();
    const filteredClasses = scheduledClasses.filter((cls) => {
      const clsDate = new Date(cls.startTime).toLocaleDateString();
      return clsDate === new Date().toLocaleDateString();
    });
    return (
      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-lg font-bold mb-4">Static QR Codes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <SpaceQRCode />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold mb-4">Today&apos;s Classes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClasses.map((cls) => (
              <QRTemplateGenerator key={cls._id} scls={cls} />
            ))}
          </div>
        </div>
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
