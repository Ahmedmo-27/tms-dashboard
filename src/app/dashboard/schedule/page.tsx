export const dynamic = "force-dynamic";
import React from "react";
import { getClasses } from "@/lib/data/class";
import { SchedulePage } from "./schedulePage";
import { getScheduledClasses } from "@/lib/data/schedule";
import { Class } from "@/components/ui/classes/columns";
import { NetworkError, NotFoundError, UnauthorizedError } from "@/core/api-error";
import { getCoaches } from "@/lib/data/coaches";
import { getLocations } from "@/lib/data/locations";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export default async function Page() {
  try {
    const [scheduledClasses, classes, coaches, locationDocs] = await Promise.all([
      getScheduledClasses().catch((e) => {
        if (e instanceof NotFoundError) return [];
        throw e;
      }),
      getClasses().catch((e) => {
        if (e instanceof NotFoundError) return [] as Class[];
        throw e;
      }),
      getCoaches().catch((e) => {
        if (e instanceof NotFoundError) return [];
        throw e;
      }),
      getLocations().catch(() => []),
    ]);

    const locations = locationDocs.map((l) => l.branchName);

    // ✅ Explicitly type Map<string, string>
    const classIdsMap: Map<string, string> = new Map(
      (classes as Class[]).map((cls) => [cls.title, cls._id])
    );

    return (
      <SchedulePage
        scheduledClasses={scheduledClasses}
        classIdsMap={classIdsMap}
        coaches={coaches}
        locations={locations}
      />
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Schedule Unavailable"
          description="Unable to load schedule due to network issues."
          showBackButton={false}
        />
      );
    } else if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }

    throw error; // Let Next.js handle unexpected errors
  }
}
