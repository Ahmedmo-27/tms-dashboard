import { Member } from "@/components/ui/members/columns";

export const parseMembers = (members: any): Member[] => {
  if (!Array.isArray(members)) return [];
  const parsedMembers: Member[] = [];
  members.forEach((member: any) => {
    if (!member || !member.uid) return;

    const parsedPackages: any = [];
    (member.packages || []).forEach((pkg: any) => {
      if (!pkg || !pkg.pkgId) {
        parsedPackages.push({
          _id: "ERROR",
          name: "ERROR - Contact Support",
          pkgStartDate: "",
          pkgEndDate: "",
          remainingClasses: "",
          status: "",
          adjustmentHistory: [],
          attendance: [],
        });
        return;
      }

      const pkgIdStr = pkg.pkgId._id?.toString() ?? pkg.pkgId?.toString() ?? "";

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

      const parsedPackage = {
        _id: pkgIdStr,
        name: pkg.pkgId.name ?? "Package",
        pkgStartDate: pkg.pkgStartDate ?? "",
        pkgEndDate: pkg.pkgEndDate ?? "",
        remainingClasses: pkg.remainingClasses ?? 0,
        status: pkg.status ?? "",
        adjustmentHistory: pkg.adjustmentHistory ?? [],
        attendance: bundledAttendance,
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
      activePkgs: parsedPackages.filter((p: any) => p.status?.toUpperCase() === "ACTIVE").length,
      ptAttendance: parsedPtAttendance,
    };
    parsedMembers.push(parsedMember);
  });
  return parsedMembers;
};
