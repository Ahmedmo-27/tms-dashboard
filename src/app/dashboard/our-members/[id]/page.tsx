import { getMembers } from "@/lib/data/member";
import MemberPage from "./memberPage";
import { Card, CardContent } from "@/components/ui/card";
import { getPackages } from "@/lib/data/package";
import { getNextScheduledClasses } from "@/lib/data/schedule";
import { Package } from "@/components/ui/packages/columns";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import NetworkErrorPage from "@/components/ui/error-pages/network-error";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return (
      <Card className="m-4 sm:m-6">
        <CardContent className="flex items-center justify-center h-24 sm:h-32 p-4 sm:p-6">
          <p className="text-sm sm:text-base text-muted-foreground text-center">Member not found</p>
        </CardContent>
      </Card>
    );
  }

  try {
    const [packages, upcomingSchedule, data] = await Promise.all([
      getPackages().catch(() => [] as Package[]),
      getNextScheduledClasses().catch(() => [] as ScheduledClass[]),
      getMembers(null, 1, 1, id),
    ]);

    const scheduledClasses: ScheduledClass[] = upcomingSchedule;

    const memberData = data?.data?.[0];
    if (!memberData) {
      return (
        <Card className="m-4 sm:m-6">
          <CardContent className="flex items-center justify-center h-24 sm:h-32 p-4 sm:p-6">
            <p className="text-sm sm:text-base text-muted-foreground text-center">Member not found</p>
          </CardContent>
        </Card>
      );
    }
    const member = {
      id: memberData.id,
      name: memberData.name,
      phone: memberData.phone,
      email: memberData.email,
      activePkgs: memberData.activePkgs,
      packages: memberData.packages,
      bookings: memberData.bookings,
      ptAttendance: memberData.ptAttendance,
    };
    return (
      <MemberPage
        member={member}
        packages={packages}
        scheduledClasses={scheduledClasses}
      />
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return <NetworkErrorPage />;
    } else if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
    return (
      <Card className="m-4 sm:m-6">
        <CardContent className="flex items-center justify-center h-24 sm:h-32 p-4 sm:p-6">
          <p className="text-sm sm:text-base text-muted-foreground text-center">
            {error instanceof Error ? error.message : "Member not found"}
          </p>
        </CardContent>
      </Card>
    );
  }
}
