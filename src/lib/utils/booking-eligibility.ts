import { Member, MemberPackage } from "@/components/ui/members/columns";
import { Package } from "@/components/ui/packages/columns";
import { ScheduledClass } from "@/components/ui/schedule/columns";

export type BookingEligibilityResult = {
  eligible: boolean;
  reason?: string;
  coveringPackageName?: string;
};

function isPackageActive(pkg: MemberPackage): boolean {
  if (pkg.status !== "ACTIVE") return false;
  if (Number(pkg.remainingClasses) <= 0) return false;

  const now = new Date();
  if (pkg.pkgEndDate && new Date(pkg.pkgEndDate) < now) return false;
  if (pkg.pkgStartDate && new Date(pkg.pkgStartDate) > now) return false;

  return true;
}

function packageOpensClass(catalogPkg: Package, classCid: string): boolean {
  const opens = catalogPkg.opensClasses?.filter(Boolean) ?? [];
  if (opens.length === 0) return false;
  return opens.some((c) => c._id === classCid);
}

function buildScidToCidMap(
  scheduledClasses: ScheduledClass[]
): Map<string, string> {
  return new Map(
    scheduledClasses
      .filter((c) => c._id && c.cid)
      .map((c) => [c._id!, c.cid])
  );
}

function countClassUsageForPackage(
  member: Member,
  memberPkg: MemberPackage,
  classCid: string,
  className: string,
  scidToCid: Map<string, string>
): number {
  const bookingCount = member.bookings.filter((booking) => {
    const bookingCid = scidToCid.get(booking.scid);
    return bookingCid === classCid;
  }).length;

  const attendanceCount = (memberPkg.attendance ?? []).filter(
    (record) => record.className === className
  ).length;

  return bookingCount + attendanceCount;
}

export function getBookingEligibility(
  member: Member,
  scheduledClass: ScheduledClass,
  catalogPackages: Package[],
  allScheduledClasses: ScheduledClass[]
): BookingEligibilityResult {
  if (scheduledClass.availableSlots <= 0) {
    return { eligible: false, reason: "No available slots in this class" };
  }

  const classStart = new Date(scheduledClass.startTime);
  if (classStart < new Date()) {
    return { eligible: false, reason: "This class has already started" };
  }

  const alreadyBookedByScid = member.bookings.some(
    (booking) => booking.scid === scheduledClass._id
  );
  const alreadyOnClassList = scheduledClass.bookedMembers?.some(
    (bookedMember) => bookedMember.uid === member.id
  );

  if (alreadyBookedByScid || alreadyOnClassList) {
    return {
      eligible: false,
      reason: "Member is already booked for this class",
    };
  }

  const classCid = scheduledClass.cid;
  if (!classCid) {
    return { eligible: false, reason: "Class information is incomplete" };
  }

  const catalogById = new Map(catalogPackages.map((pkg) => [pkg._id, pkg]));
  const scidToCid = buildScidToCidMap(allScheduledClasses);
  const activePackages = member.packages.filter(isPackageActive);

  if (activePackages.length === 0) {
    return {
      eligible: false,
      reason: "Member has no active packages with remaining sessions",
    };
  }

  let opensClassButRestricted = false;

  for (const memberPkg of activePackages) {
    const catalogPkg = catalogById.get(memberPkg._id);
    if (!catalogPkg || !packageOpensClass(catalogPkg, classCid)) {
      continue;
    }

    const restriction = catalogPkg.classRestrictions?.find(
      (entry) => entry.cid === classCid
    );

    if (restriction) {
      const used = countClassUsageForPackage(
        member,
        memberPkg,
        classCid,
        scheduledClass.className ?? "",
        scidToCid
      );

      if (used >= restriction.limit) {
        opensClassButRestricted = true;
        continue;
      }
    }

    return {
      eligible: true,
      coveringPackageName: memberPkg.name,
    };
  }

  if (opensClassButRestricted) {
    return {
      eligible: false,
      reason: `Session limit reached for "${scheduledClass.className}" on the member's package`,
    };
  }

  return {
    eligible: false,
    reason: `None of the member's packages include "${scheduledClass.className}"`,
  };
}

export function getActivePackagesSummary(
  member: Member,
  catalogPackages: Package[]
): { name: string; remainingClasses: number; opensTitles: string[] }[] {
  const catalogById = new Map(catalogPackages.map((pkg) => [pkg._id, pkg]));

  return member.packages
    .filter(isPackageActive)
    .map((memberPkg) => {
      const catalogPkg = catalogById.get(memberPkg._id);
      const opensTitles =
        catalogPkg?.opensClasses?.map((c) => c.title).filter(Boolean) ?? [];

      return {
        name: memberPkg.name,
        remainingClasses: Number(memberPkg.remainingClasses),
        opensTitles,
      };
    });
}
