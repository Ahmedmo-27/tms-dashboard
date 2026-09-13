export const dynamic = "force-dynamic";

import PackageFreezesContent from "@/components/ui/package-freezes/package-freezes-content";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export default async function Page() {
  try {
    return <PackageFreezesContent />;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
    if (error instanceof NetworkError) {
      return <NetworkErrorPage />;
    }
    throw error;
  }
}
