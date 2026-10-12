import { ScheduledClass } from "@/components/ui/schedule/columns";
import { ClassScan } from "@/components/ui/scans/class-container";
import { ClassContainerProps } from "@/components/ui/scans/class-container";
import { getBranchLabel } from "@/lib/utils/location-label";
import { formatInTimeZone } from "date-fns-tz";

function parseScanStatus(
  status: boolean | string | undefined
): ClassScan["status"] {
  if (typeof status === "boolean") {
    return status ? "SUCCESS" : "FAILED";
  }
  if (status === "SUCCESS" || status === "FAILED" || status === "WILL_PAY" || status === "FOC") {
    return status;
  }
  return "FAILED";
}

function getMemberId(uid: { _id?: string } | string | undefined): string | undefined {
  if (!uid) return undefined;
  if (typeof uid === "string") return uid;
  return uid._id;
}

function getId(value: { _id?: string } | string | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value._id ? String(value._id) : undefined;
}

function getFailedStatusDetail(
  status: ClassScan["status"],
  method?: string
): string | undefined {
  if (status !== "FAILED" || !method) return undefined;
  if (method === "No Active Package") return "No active package found";
  if (method === "No Access At Location") return "No access at this branch";
  if (method === "Package Frozen") return "Package is currently frozen";
  if (method === "Package Expired") return "Package has expired";
  return undefined;
}

export const parseScans = (
  scheduledClasses: ScheduledClass[],
  date?: Date | string
) => {
  const output: ClassContainerProps[] = [];
  const targetDateStr = date
    ? typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())
      ? date.trim()
      : formatInTimeZone(
          typeof date === "string" ? new Date(date) : date,
          "Africa/Cairo",
          "yyyy-MM-dd"
        )
    : undefined;

  scheduledClasses.forEach((cls) => {
    const parsedScans: ClassScan[] = [];
    cls.scans.forEach((scan: any) => {
      const status = parseScanStatus(scan.status);
      const memberId = getMemberId(scan.uid);
      const matchingBooked = memberId
        ? cls.bookedMembers?.find(
            (b: any) =>
              (b.uid?._id ? String(b.uid._id) : String(b.uid ?? "")) === memberId
          )
        : undefined;
      const memberName =
        scan.uid?.name ||
        (matchingBooked?.uid as any)?.name ||
        matchingBooked?.name ||
        "Unknown Member";
      const memberPhone =
        scan.uid?.phoneNumber ||
        (matchingBooked?.uid as any)?.phoneNumber ||
        matchingBooked?.phone ||
        "No Phone";
      const parsedScan: ClassScan = {
        member: memberName,
        memberId,
        phone: memberPhone,
        time: new Date(scan.scanTime).toString(),
        method: scan.method === "Waitlist Confirmed" ? "Walk In" : scan.method,
        status,
        statusDetail: getFailedStatusDetail(status, scan.method),
        bookingId: scan.bookingId,
        source: "class",
        parentId: cls._id,
        rowId: getId(scan._id),
        pkgId: getId(scan.pkgId),
        isGuest: !memberId,
      };
      parsedScans.push(parsedScan);
    });

    const classDateStr = formatInTimeZone(
      new Date(cls.startTime),
      "Africa/Cairo",
      "yyyy-MM-dd"
    );

    if (!targetDateStr || classDateStr === targetDateStr) {
      output.push({
        classData: cls,
        classScans: parsedScans,
      });
    }
  });
  output.sort(
    (a, b) =>
      Math.abs(new Date(a.classData.startTime).getTime() - Date.now()) -
      Math.abs(new Date(b.classData.startTime).getTime() - Date.now())
  );
  return output;
};

export const parseDailyAttendance = (scans: any) => {
  const output: { pt: ClassScan[]; openGym: ClassScan[] } = {
    pt: [],
    openGym: [],
  };

  const record = scans?.[0];
  if (!record) {
    return output;
  }

  const dayId = getId(record._id);

  (record.ptAttendance ?? []).forEach((scan: any) => {
    const status = parseScanStatus(scan.status);
    let method = scan.method || "";
    if (typeof method === "string" && /^PT with\s+/i.test(method)) {
      method = method.replace(/^PT with\s+/i, "PT dropin with ");
    }
    const parsedScan: ClassScan = {
      member: scan.uid?.name || scan.guestName || "Unknown Member",
      memberId: getMemberId(scan.uid),
      phone: scan.uid?.phoneNumber || scan.guestPhone || "No Phone",
      time: new Date(scan.time).toString(),
      method,
      status,
      statusDetail: getFailedStatusDetail(status, method),
      branchLabel: getBranchLabel(scan.locationId) ?? undefined,
      source: "pt",
      parentId: dayId,
      rowId: getId(scan._id),
      pkgId: getId(scan.pkgId),
    };
    output.pt.push(parsedScan);
  });

  (record.openGymAttendance ?? []).forEach((scan: any) => {
    const status = parseScanStatus(scan.status);
    const parsedScan: ClassScan = {
      member: scan.uid?.name || scan.guestName || "Unknown Member",
      memberId: getMemberId(scan.uid),
      phone: scan.uid?.phoneNumber || scan.guestPhone || "No Phone",
      time: new Date(scan.time).toString(),
      method: scan.method,
      status,
      statusDetail: getFailedStatusDetail(status, scan.method),
      branchLabel: getBranchLabel(scan.locationId) ?? undefined,
      source: "open-gym",
      parentId: dayId,
      rowId: getId(scan._id),
      pkgId: getId(scan.pkgId),
      isGuest: !scan.uid && Boolean(scan.guestName || scan.guestPhone),
    };
    output.openGym.push(parsedScan);
  });

  return output;
};
