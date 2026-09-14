import { Member } from "@/components/ui/members/columns";

export const parseMembers = (members: any): Member[] => {
  if (!Array.isArray(members)) return [];
  const parsedMembers: Member[] = [];
  members.forEach((member: any) => {
    if (!member || !member.uid) return;

    const parsedPackages: any = [];
    (member.packages || []).forEach((pkg: any) => {
      if (!pkg) return;

      const pkgIdStr =
        pkg.pkgId?._id?.toString() ??
        pkg.pkgId?.toString() ??
        pkg._id?.toString() ??
        "ERROR";

      const pkgName =
        pkg.pkgId?.name ??
        pkg.name ??
        (pkg.pkgId ? "Package" : "Archived Package");

      const bundledAttendance = (member.ptAttendance ?? [])
        .filter((rec: any) => {
          if (!rec) return false;
          const recPkgId =
            rec.pkgId?._id?.toString() ?? rec.pkgId?.toString();
          return recPkgId === pkgIdStr;
        })
        .map((rec: any) => ({
          className: rec.pkgId?.name ?? "PT Attendance",
          attendanceDate: rec.attendanceTime,
        }));

      const rawStatus = (pkg.status ?? "").toUpperCase();
      const isFrozen = rawStatus === "FROZEN" || Boolean(pkg.freezeInfo?.isFrozen);
      const pkgEndDateStr = pkg.pkgEndDate ?? "";
      const pkgStartDateStr = pkg.pkgStartDate ?? "";
      const remainingClasses =
        typeof pkg.remainingClasses === "number"
          ? pkg.remainingClasses
          : (Number(pkg.remainingClasses) || 0);

      const isSpaceEligible =
        pkgName &&
        /spacer\s*mix|open\s*gym|ultimate\s*mindspacer|space\s*membership/i.test(pkgName);

      let effectiveStatus = rawStatus;
      if (rawStatus !== "DELETED") {
        if (isFrozen) {
          effectiveStatus = "FROZEN";
        } else if (
          pkgEndDateStr &&
          !isNaN(new Date(pkgEndDateStr).getTime()) &&
          new Date(pkgEndDateStr) < new Date()
        ) {
          effectiveStatus = "EXPIRED";
        } else if (
          remainingClasses <= 0 &&
          pkg.remainingClasses !== undefined &&
          pkg.remainingClasses !== "" &&
          !isSpaceEligible
        ) {
          effectiveStatus = "COMPLETED";
        } else if (!rawStatus || rawStatus === "ACTIVE") {
          effectiveStatus = "ACTIVE";
        }
      }

      const parsedPackage = {
        _id: pkgIdStr,
        name: pkgName,
        pkgStartDate: pkgStartDateStr,
        pkgEndDate: pkgEndDateStr,
        remainingClasses: remainingClasses,
        status: effectiveStatus,
        adjustmentHistory: pkg.adjustmentHistory ?? [],
        attendance: bundledAttendance,
        freezeInfo: pkg.freezeInfo,
      };
      parsedPackages.push(parsedPackage);
    });

    const parsedBookings: any = [];
    (member.bookings || []).forEach((booking: any) => {
      if (!booking || !booking.scid || !booking.scid.cid) {
        parsedBookings.push({
          scid: "ERROR",
          className: "ERROR - Contact support",
          bookingTime: "",
          classTime: "",
        });
        return;
      }
      const parsedBooking = {
        scid: booking.scid._id?.toString() ?? String(booking.scid._id),
        className: booking.scid.cid.title ?? "Class",
        bookingTime: booking.bookingTime,
        classTime: booking.scid.startTime,
      };
      parsedBookings.push(parsedBooking);
    });

    const parsedPtAttendance: any = [];
    (member.ptAttendance || []).forEach((record: any) => {
      if (!record) return;
      const parsedRecord = {
        attendanceTime: record.attendanceTime,
        package: record.pkgId?.name ?? "PT Attendance",
      };
      parsedPtAttendance.push(parsedRecord);
    });

    const parsedMember: Member = {
      id: member.uid._id?.toString() ?? String(member.uid._id ?? ""),
      name: member.uid.name ?? "Unknown",
      phone: member.uid.phoneNumber ?? "",
      email: member.uid.email ?? "",
      packages: parsedPackages,
      bookings: parsedBookings,
      activePkgs: parsedPackages.filter(
        (p: any) =>
          p.status?.toUpperCase() === "ACTIVE" &&
          (!p.pkgEndDate || new Date(p.pkgEndDate) >= new Date())
      ).length,
      ptAttendance: parsedPtAttendance,
    };
    parsedMembers.push(parsedMember);
  });
  return parsedMembers;
};
