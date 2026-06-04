import { Member } from "@/components/ui/members/columns";
export const parseMembers = (members: any) => {
  const parsedMembers: Member[] = [];
  members.forEach((member: any) => {
    const parsedPackages: any = [];
    member.packages.forEach((pkg: any) => {
      if (!pkg.pkgId) {
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

      const pkgIdStr = pkg.pkgId._id?.toString() ?? pkg.pkgId?.toString();

      const bundledAttendance = (member.ptAttendance ?? [])
        .filter((rec: any) => {
          const recPkgId =
            rec.pkgId?._id?.toString() ?? rec.pkgId?.toString();
          return recPkgId === pkgIdStr;
        })
        .map((rec: any) => ({
          className: rec.pkgId?.name ?? "PT Attendance",
          attendanceDate: rec.attendanceTime,
        }));

      const parsedPackage = {
        _id: pkg.pkgId._id,
        name: pkg.pkgId.name,
        pkgStartDate: pkg.pkgStartDate,
        pkgEndDate: pkg.pkgEndDate,
        remainingClasses: pkg.remainingClasses,
        status: pkg.status,
        adjustmentHistory: pkg.adjustmentHistory ?? [],
        attendance: bundledAttendance,
      };
      parsedPackages.push(parsedPackage);
    });
    const parsedBookings: any = [];
    member.bookings.forEach((booking: any) => {
      if (!booking.scid || !booking.scid.cid) {
        parsedBookings.push({
          scid: "ERROR",
          className: "ERROR - Contact support",
          bookingTime: "",
          classTime: "",
        });
        return;
      }
      const parsedBooking = {
        scid: booking.scid._id,
        className: booking.scid.cid.title,
        bookingTime: booking.bookingTime,
        classTime: booking.scid.startTime,
      };
      parsedBookings.push(parsedBooking);
    });
    const parsedPtAttendance: any = [];
    member.ptAttendance.forEach((record: any) => {
      const parsedRecord = {
        attendanceTime: record.attendanceTime,
        package: record.pkgId.name,
      };
      parsedPtAttendance.push(parsedRecord);
    });
    const parsedMember: Member = {
      id: member.uid._id,
      name: member.uid.name,
      phone: member.uid.phoneNumber,
      email: member.uid.email,
      packages: parsedPackages,
      bookings: parsedBookings,
      activePkgs: member.packages.length,
      ptAttendance: parsedPtAttendance,    // Changed this line to use the parsedPtAttendance array
    };
    parsedMembers.push(parsedMember);
  });
  return parsedMembers;
};
