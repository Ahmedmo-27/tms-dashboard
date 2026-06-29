export const dynamic = "force-dynamic";

import MemberRequestsContent from "@/components/ui/member-requests/member-requests-content";
import { getPackages } from "@/lib/data/package";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export default async function Page() {
  try {
    const packages = await getPackages();
    return <MemberRequestsContent packages={packages} />;
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
