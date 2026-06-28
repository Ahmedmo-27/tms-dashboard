import { Member } from "@/components/ui/members/columns";
import MemberDetails from "@/components/ui/cards/member-details";
import Packages from "@/components/ui/cards/packages";
import Bookings from "@/components/ui/cards/bookings";
import { Package } from "@/components/ui/packages/columns";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import PTAttendance from "@/components/ui/cards/ptAttendance";

export default function MemberPage({
  member,
  packages,
  scheduledClasses,
}: {
  member: Member;
  packages: Package[];
  scheduledClasses: ScheduledClass[];
}) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header / Member Info */}
      <section>
        <MemberDetails member={member} />
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packages */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">

          <Packages
            memberPackages={member?.packages || []}
            uid={member?.id || ""}
            packages={packages}
          />
        </div>

        {/* Bookings */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
          <Bookings
            bookings={member?.bookings || []}
            scheduledClasses={scheduledClasses}
            uid={member.id}
            memberName={member.name}
          />
        </div>
      </section>

      {/* Attendance */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">

        <PTAttendance attendance={member?.ptAttendance || []} />
      </section>
    </div>
  );
}
