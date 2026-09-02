import { Member, MemberPackage } from "@/components/ui/members/columns";
import { Package } from "@/components/ui/packages/columns";
import { ScheduledClass } from "@/components/ui/schedule/columns";

export type BookingEligibilityResult = {
  eligible: boolean;
  reason?: string;
  coveringPackageName?: string;
};

export const BOOKING_TIME_RESTRICTION_REASON =
  "This class has already started";

export type BookingEligibilityOptions = {
  overrideTimeRestrictions?: boolean;
};

export function isBookingTimeRestriction(
  result: BookingEligibilityResult
): boolean {
  return (
    !result.eligible && result.reason === BOOKING_TIME_RESTRICTION_REASON
  );
}

export type PackageSummaryItem = {
  name: string;
  remainingClasses: number;
  status: string;
  startDate?: string;
  endDate?: string;
  opensTitles: string[];
  isActive: boolean;
  isExpired: boolean;
  isDepleted: boolean;
  isFuture: boolean;
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isPackageActive(pkg: MemberPackage): boolean {
  if (pkg.status !== "ACTIVE") return false;
  if (Number(pkg.remainingClasses) <= 0) return false;

  const now = new Date();
  if (pkg.pkgEndDate && new Date(pkg.pkgEndDate) < now) return false;
  if (pkg.pkgStartDate && new Date(pkg.pkgStartDate) > now) return false;

  return true;
}

function packageOpensClass(catalogPkg: Package | undefined, classCid: string): boolean {
  if (!catalogPkg) return false;
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
  allScheduledClasses: ScheduledClass[],
  options?: BookingEligibilityOptions
): BookingEligibilityResult {
  const className = scheduledClass.className || "this class";

  if (scheduledClass.availableSlots <= 0) {
    return { eligible: false, reason: `No available slots in "${className}"` };
  }

  const classStart = new Date(scheduledClass.startTime);
  if (!options?.overrideTimeRestrictions && classStart < new Date()) {
    return { eligible: false, reason: BOOKING_TIME_RESTRICTION_REASON };
  }

  const alreadyBookedByScid = member.bookings.some(
    (booking) => String(booking.scid) === String(scheduledClass._id)
  );
  const alreadyOnClassList = scheduledClass.bookedMembers?.some(
    (bookedMember) => bookedMember.uid === member.id
  );

  if (alreadyBookedByScid || alreadyOnClassList) {
    return {
      eligible: false,
      reason: `Member is already booked for "${className}"`,
    };
  }

  const classCid = scheduledClass.cid;
  if (!classCid) {
    return { eligible: false, reason: "Class information is incomplete" };
  }

  if (!member.packages || member.packages.length === 0) {
    return {
      eligible: false,
      reason: `Member has no packages on account. A package covering "${className}" is required.`,
    };
  }

  const catalogById = new Map(catalogPackages.map((pkg) => [pkg._id, pkg]));
  const scidToCid = buildScidToCidMap(allScheduledClasses);
  const now = new Date();

  // Find all packages of the member that open this class
  const matchingPackages = member.packages.filter((mp) => {
    const cat = catalogById.get(mp._id);
    return packageOpensClass(cat, classCid);
  });

  if (matchingPackages.length > 0) {
    let restrictedReason: string | undefined;
    let depletedReason: string | undefined;
    let expiredReason: string | undefined;
    let futureReason: string | undefined;

    for (const memberPkg of matchingPackages) {
      if (memberPkg.pkgStartDate && new Date(memberPkg.pkgStartDate) > now) {
        futureReason = `Package "${memberPkg.name}" covering "${className}" starts on ${formatDate(memberPkg.pkgStartDate)} and is not active yet.`;
        continue;
      }

      if (memberPkg.pkgEndDate && new Date(memberPkg.pkgEndDate) < now) {
        expiredReason = `Package "${memberPkg.name}" covering "${className}" expired on ${formatDate(memberPkg.pkgEndDate)}.`;
        continue;
      }

      if (Number(memberPkg.remainingClasses) <= 0) {
        depletedReason = `Package "${memberPkg.name}" covering "${className}" has 0 remaining sessions.`;
        continue;
      }

      if (memberPkg.status !== "ACTIVE") {
        continue;
      }

      const catalogPkg = catalogById.get(memberPkg._id);
      const restriction = catalogPkg?.classRestrictions?.find(
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
          restrictedReason = `Monthly limit of ${restriction.limit} session(s) for "${className}" has been reached on package "${memberPkg.name}".`;
          continue;
        }
      }

      return {
        eligible: true,
        coveringPackageName: memberPkg.name,
      };
    }

    if (restrictedReason) return { eligible: false, reason: restrictedReason };
    if (depletedReason) return { eligible: false, reason: depletedReason };
    if (expiredReason) return { eligible: false, reason: expiredReason };
    if (futureReason) return { eligible: false, reason: futureReason };
  }

  const activePackages = member.packages.filter(isPackageActive);
  if (activePackages.length > 0) {
    const activeNames = activePackages.map((p) => `"${p.name}"`).join(", ");
    return {
      eligible: false,
      reason: `None of the member's active packages (${activeNames}) include "${className}".`,
    };
  }

  return {
    eligible: false,
    reason: `Member has no active packages covering "${className}".`,
  };
}

export function getActivePackagesSummary(
  member: Member,
  catalogPackages: Package[]
): PackageSummaryItem[] {
  const catalogById = new Map(catalogPackages.map((pkg) => [pkg._id, pkg]));
  const now = new Date();

  return (member.packages || []).map((memberPkg) => {
    const catalogPkg = catalogById.get(memberPkg._id);
    const opensTitles =
      catalogPkg?.opensClasses?.map((c) => c.title).filter(Boolean) ?? [];

    const isExpired = !!memberPkg.pkgEndDate && new Date(memberPkg.pkgEndDate) < now;
    const isFuture = !!memberPkg.pkgStartDate && new Date(memberPkg.pkgStartDate) > now;
    const isDepleted = Number(memberPkg.remainingClasses) <= 0;
    const isActive = memberPkg.status === "ACTIVE" && !isExpired && !isFuture && !isDepleted;

    return {
      name: memberPkg.name,
      remainingClasses: Number(memberPkg.remainingClasses),
      status: memberPkg.status,
      startDate: memberPkg.pkgStartDate,
      endDate: memberPkg.pkgEndDate,
      opensTitles,
      isActive,
      isExpired,
      isDepleted,
      isFuture,
    };
  });
}
