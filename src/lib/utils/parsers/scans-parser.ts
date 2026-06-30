import { ScheduledClass } from "@/components/ui/schedule/columns";
import { ClassScan } from "@/components/ui/scans/class-container";
import { ClassContainerProps } from "@/components/ui/scans/class-container";

function parseScanStatus(
  status: boolean | string | undefined
): ClassScan["status"] {
  if (typeof status === "boolean") {
    return status ? "SUCCESS" : "FAILED";
  }
  if (status === "SUCCESS" || status === "FAILED" || status === "WILL_PAY") {
    return status;
  }
  return "FAILED";
}

function getFailedStatusDetail(
  status: ClassScan["status"],
  method?: string
): string | undefined {
  if (status !== "FAILED" || !method) return undefined;
  if (method === "No Active Package") return "No active package found";
  return undefined;
}

export const parseScans = (scheduledClasses: ScheduledClass[], date: Date) => {
  const output: ClassContainerProps[] = [];

  scheduledClasses.forEach((cls) => {
    const parsedScans: ClassScan[] = [];
    cls.scans.forEach((scan: any) => {
      const status = parseScanStatus(scan.status);
      const parsedScan: ClassScan = {
        member: scan.uid?.name || "Unknown Member",
        phone: scan.uid?.phoneNumber || "No Phone",
        time: new Date(scan.scanTime).toString(),
        method: scan.method,
        status,
        statusDetail: getFailedStatusDetail(status, scan.method),
        bookingId: scan.bookingId,
      };
      parsedScans.push(parsedScan);
    });
    if (
      new Date(cls.startTime).toDateString() === new Date(date).toDateString()
    ) {
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

  (record.ptAttendance ?? []).forEach((scan: any) => {
    const status = parseScanStatus(scan.status);
    const parsedScan: ClassScan = {
      member: scan.uid?.name || "Unknown Member",
      phone: scan.uid?.phoneNumber || "No Phone",
      time: new Date(scan.time).toString(),
      method: scan.method,
      status,
      statusDetail: getFailedStatusDetail(status, scan.method),
    };
    output.pt.push(parsedScan);
  });

  (record.openGymAttendance ?? []).forEach((scan: any) => {
    const status = parseScanStatus(scan.status);
    const parsedScan: ClassScan = {
      member: scan.uid?.name || "Unknown Member",
      phone: scan.uid?.phoneNumber || "No Phone",
      time: new Date(scan.time).toString(),
      method: scan.method,
      status,
      statusDetail: getFailedStatusDetail(status, scan.method),
    };
    output.openGym.push(parsedScan);
  });

  return output;
};
