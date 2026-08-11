import { Member } from "@/components/ui/members/columns";
import { Package } from "@/components/ui/packages/columns";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import { MemberWorkspace } from "@/components/ui/members/member-workspace";

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
    <MemberWorkspace
      member={member}
      packages={packages}
      scheduledClasses={scheduledClasses}
    />
  );
}
