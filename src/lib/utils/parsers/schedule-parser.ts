import { ScheduledClass } from "@/components/ui/schedule/columns";

export const parseSchedule = (
  schedule: any,
  nonUserBookings: any
): ScheduledClass[] => {
  const scheduledClasses: ScheduledClass[] = [];
  schedule.forEach((cls: any) => {
    const parsedBookedMembers: any = [];
    const walkInScans: any = [];
    cls.bookedMembers.forEach((member: any) => {
      let parsedBookedMember;
      if (!member.uid) {
        parsedBookedMember = {
          name: member.name,
          phone: member.phoneNumber,
        };
      } else {
        const hasAttended = cls.scans.some(
          (scan: any) =>
            scan.uid?._id?.toString() === member.uid._id?.toString() &&
            scan.status === true
        );
        parsedBookedMember = {
          name: member.uid.name,
          phone: member.uid.phoneNumber,
          uid: member.uid._id?.toString(),
          attended: hasAttended,
        };
      }
      parsedBookedMembers.push(parsedBookedMember);
    });
    nonUserBookings.forEach((entry: any) => {
      if (entry.scid === cls._id && entry.status!=="CANCELLED") {
        parsedBookedMembers.push({
          name: entry.name,
          phone: entry.phoneNumber,
          bookingId: entry._id,
          attended: entry.status === "ATTENDED" || entry.status === "PAID",
          canceled: entry.status === "CANCELLED",
          paid: entry.status === "PAID",
        });
        if (entry.status === "ATTENDED") {
          console.log(entry);
          walkInScans.push({
            uid: {
              name: entry.name,
              phoneNumber: entry.phoneNumber,
            },
            scanTime: entry.attendanceTime
              ? new Date(entry.attendanceTime)
              : new Date(),
            method: "Walk In",
            status: "WILL_PAY",
            bookingId: entry._id,
          });
        }
        if (entry.status === "PAID") {
          walkInScans.push({
            uid: {
              name: entry.name,
              phoneNumber: entry.phoneNumber,
            },
            method: "Walk In",
            status: "SUCCESS",
            scanTime: entry.attendanceTime
              ? new Date(entry.attendanceTime)
              : new Date(),
            bookingId: entry._id,
          });
        }
      }
    });
    const allScans = [...cls.scans, ...walkInScans];
    const parsedClass: ScheduledClass = {
      _id: cls._id,
      cid: cls.cid._id,
      availableSlots: cls.availableSlots,
      className: cls.cid.title,
      coachName: cls.coachId.coachName,
      coachId: cls.coachId._id,
      location: cls.cid.locations[0]?.branchName ?? "No location",
      startTime: new Date(cls.startTime).toString(),
      endTime: new Date(cls.endTime).toString(),
      category: cls.cid.category,
      bookedMembers: parsedBookedMembers,
      scans: allScans,
    };
    scheduledClasses.push(parsedClass);
  });
  scheduledClasses.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  return scheduledClasses;
};
