import { ScheduledClass } from "@/components/ui/schedule/columns";
import { ClassScan } from "@/components/ui/scans/class-container";
import { ClassContainerProps } from "@/components/ui/scans/class-container";
import { formatDate } from "date-fns";

export const parseScans = (scheduledClasses: ScheduledClass[], date: Date) => {
  const output: ClassContainerProps[] = [];

  scheduledClasses.forEach((cls) => {
    const parsedScans: ClassScan[] = [];
    cls.scans.forEach((scan: any) => {
       
      const parsedScan: ClassScan = {
        member: scan.uid?.name || "Unknown Member",
        phone: scan.uid?.phoneNumber || "No Phone",
        time: new Date(scan.scanTime).toString(),
        method: scan.method,
        status: typeof scan.status === "boolean"?(scan.status?"SUCCESS":"FAILED"):scan.status,
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
  scans[0].ptAttendance.forEach((scan: any) => {
    const parsedScan: ClassScan = {
      member: scan.uid?.name || "Unknown Member",
      phone: scan.uid?.phoneNumber || "No Phone",
      time: new Date(scan.time).toString(),
      method: scan.method,
      status: typeof scan.status === "boolean" ? (scan.status ? "SUCCESS" : "FAILED") : scan.status,
    };
    output.pt.push(parsedScan);
  });
  scans[0].openGymAttendance.forEach((scan: any) => {
    const parsedScan: ClassScan = {
      member: scan.uid?.name || "Unknown Member",
      phone: scan.uid?.phoneNumber || "No Phone",
      time: new Date(scan.time).toString(),
      method: scan.method,
      status: typeof scan.status === "boolean" ? (scan.status ? "SUCCESS" : "FAILED") : scan.status,
    };
    output.openGym.push(parsedScan);
  });
  console.log(output);
  return output;
};
