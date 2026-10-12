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
      const entryScid =
        typeof entry.scid === "object" && entry.scid?._id
          ? String(entry.scid._id)
          : String(entry.scid ?? "");
      if (entryScid === String(cls._id) && entry.status !== "CANCELLED") {
        parsedBookedMembers.push({
          name: entry.name,
          phone: entry.phoneNumber,
          bookingId: entry._id,
          attended: entry.status === "ATTENDED" || entry.status === "PAID" || entry.status === "FOC",
          canceled: entry.status === "CANCELLED",
          paid: entry.status === "PAID",
          isFoc: entry.status === "FOC",
        });
        if (entry.status === "ATTENDED") {
          walkInScans.push({
            _id: entry._id,
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
            _id: entry._id,
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
        if (entry.status === "FOC") {
          walkInScans.push({
            _id: entry._id,
            uid: {
              name: entry.name,
              phoneNumber: entry.phoneNumber,
            },
            method: "FOC",
            status: "FOC",
            scanTime: entry.attendanceTime
              ? new Date(entry.attendanceTime)
              : new Date(),
            bookingId: entry._id,
          });
        }
      }
    });
    const parsedWaitlist: any[] = [];
    const rawWaitlist = cls.waitlist || cls.waitlistedMembers || [];
    if (Array.isArray(rawWaitlist)) {
      rawWaitlist.forEach((entry: any, index: number) => {
        const userObj =
          entry.uid && typeof entry.uid === "object"
            ? entry.uid
            : entry.userId && typeof entry.userId === "object"
            ? entry.userId
            : null;
        const name = userObj?.name || entry.name || "Unknown Member";
        const phone =
          userObj?.phoneNumber ||
          userObj?.phone ||
          entry.phone ||
          entry.phoneNumber ||
          "";
        const uid =
          userObj?._id?.toString() ||
          (typeof entry.uid === "string"
            ? entry.uid
            : typeof entry.userId === "string"
            ? entry.userId
            : entry._id?.toString() || "");
        parsedWaitlist.push({
          _id: entry._id?.toString() || `${uid}-${index}`,
          uid,
          name,
          phone,
          status: entry.status || "WAITING",
          position: entry.position ?? index + 1,
          addedAt: entry.addedAt
            ? new Date(entry.addedAt).toISOString()
            : entry.joinedAt
            ? new Date(entry.joinedAt).toISOString()
            : undefined,
          isManual: Boolean(entry.isManual),
        });
      });
    const allScans = [...cls.scans, ...walkInScans].map((scan: any) => ({
      ...scan,
      method: scan.method === "Waitlist Confirmed" ? "Walk In" : scan.method,
    }));
    const sessionLocation = cls.locationId;
    const parsedClass: ScheduledClass = {
      _id: cls._id,
      cid: cls.cid?._id ?? "",
      availableSlots: cls.availableSlots,
      className: cls.cid?.title ?? "Unknown Class",
      coachName: Array.isArray(cls.coachId) ? cls.coachId.map((c: any) => c.coachName).filter(Boolean).join(", ") || "Unknown Coach" : (cls.coachId?.coachName ?? "Unknown Coach"),
      coachId: Array.isArray(cls.coachId) ? cls.coachId.map((c: any) => c._id) : (cls.coachId?._id ?? ""),
      locationId:
        sessionLocation?._id?.toString() ??
        (typeof sessionLocation === "string" ? sessionLocation : ""),
      location:
        sessionLocation?.branchName ??
        sessionLocation?.location ??
        "No location",
      startTime: new Date(cls.startTime).toString(),
      endTime: new Date(cls.endTime).toString(),
      category: cls.cid?.category ?? "Unknown Category",
      classPrice: cls.cid?.price?.toString(),
      bookedMembers: parsedBookedMembers,
      waitlist: parsedWaitlist,
      scans: allScans,
      attendanceConfirmation: cls.attendanceConfirmation
        ? {
            confirmed: Boolean(cls.attendanceConfirmation.confirmed),
            confirmedCount: Number(cls.attendanceConfirmation.confirmedCount ?? 0),
            hasMissingPlace: Boolean(cls.attendanceConfirmation.hasMissingPlace),
            confirmedAt: cls.attendanceConfirmation.confirmedAt
              ? new Date(cls.attendanceConfirmation.confirmedAt).toISOString()
              : undefined,
            confirmedBy: cls.attendanceConfirmation.confirmedBy
              ? String(cls.attendanceConfirmation.confirmedBy)
              : undefined,
            notes: cls.attendanceConfirmation.notes,
          }
        : undefined,
    };
    scheduledClasses.push(parsedClass);
  });
  scheduledClasses.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  return scheduledClasses;
};
