"use client";
import { io } from "socket.io-client";
import {
  ClassContainer,
  ClassContainerProps,
  ClassScan,
} from "./class-container";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { formatDate } from "date-fns";
import { PaymentDatePicker } from "../payments/date-picker";
import { AttendanceContainer } from "./attendance-container";
import AddGuestPackage from "../dialogs/package/add-guest-package";
import { OpenGymDropInDialog } from "../dialogs/open-gym/open-gym-drop-in-dialog";
import { OpenGymSubscribeDialog } from "../dialogs/open-gym/open-gym-subscribe-dialog";
import { OpenGymPricingDialog } from "../dialogs/open-gym/open-gym-pricing-dialog";
import { fetchScansMonitorData } from "@/lib/data/scans";

const socket = io(process.env.NEXT_PUBLIC_TMS_API_URL!, {
  transports: ["websocket"],
});

function parseDateParam(value: string | null): Date {
  return value ? new Date(value) : new Date();
}

export function ScanContainer({
  scans: initialScans,
  dailyAttendance: initialDailyAttendance,
  packages,
}: {
  scans: ClassContainerProps[];
  dailyAttendance: { pt: ClassScan[]; openGym: ClassScan[] };
  packages: any;
}) {
  const searchParams = useSearchParams();

  const [scans, setScans] = useState(initialScans);
  const [dailyAttendance, setDailyAttendance] = useState(initialDailyAttendance);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parseDateParam(searchParams.get("date"))
  );
  const [selectedCheckInsDate, setSelectedCheckInsDate] = useState<Date>(() =>
    parseDateParam(searchParams.get("checkInsDate"))
  );

  // Sync when server props refresh (e.g. after dialog actions)
  useEffect(() => {
    setScans(initialScans);
    setDailyAttendance(initialDailyAttendance);
  }, [initialScans, initialDailyAttendance]);

  const fetchAll = useCallback(
    async (classDate: Date, checkInsDate: Date, silent = false) => {
      try {
        const data = await fetchScansMonitorData(classDate, checkInsDate);
        setScans(data.scans);
        setDailyAttendance(data.dailyAttendance);
      } catch {
        if (!silent) {
          toast.error("Failed to refresh scans.");
        }
      }
    },
    []
  );

  const updateUrlParam = (key: string, date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, formatDate(date, "yyyy-MM-dd"));
    window.history.replaceState(
      null,
      "",
      `/dashboard/scans-monitor?${params.toString()}`
    );
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    updateUrlParam("date", date);
    fetchAll(date, selectedCheckInsDate);
  };

  const handleCheckInsDateChange = (date: Date | undefined) => {
    if (!date) return;
    setSelectedCheckInsDate(date);
    updateUrlParam("checkInsDate", date);
    fetchAll(selectedDate, date);
  };

  // Real-time updates on scan events
  useEffect(() => {
    const handleRefresh = () => fetchAll(selectedDate, selectedCheckInsDate, true);

    socket.on("SUCCESS-SCAN", handleRefresh);

    socket.on(
      "FAILED-SCAN",
      (payload: { code: string; member: string; message: string }) => {
        toast.error(`❌ ${payload.member}: ${payload.message}`, {
          duration: 5000,
          style: {
            border: "1px solid #f87171",
            padding: "12px",
            color: "#b91c1c",
          },
          iconTheme: {
            primary: "#b91c1c",
            secondary: "#ffe4e6",
          },
        });
        handleRefresh();
      }
    );

    return () => {
      socket.off("SUCCESS-SCAN", handleRefresh);
      socket.off("FAILED-SCAN", handleRefresh);
    };
  }, [selectedDate, selectedCheckInsDate, fetchAll]);

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex flex-row justify-between text-2xl font-bold mx-5 py-4 border-b-2">
          Check Ins
          <div className="flex flex-wrap items-center gap-2">
            <OpenGymPricingDialog packages={packages} />
            <OpenGymDropInDialog />
            <OpenGymSubscribeDialog packages={packages} />
            <AddGuestPackage packages={packages} />
            <PaymentDatePicker
              selectedDate={selectedCheckInsDate}
              onDateChange={handleCheckInsDateChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 justify-center gap-4 p-4">
          <AttendanceContainer
            title="Personal Training"
            classScans={dailyAttendance.pt}
          />
          <AttendanceContainer
            title="Open Gym"
            classScans={dailyAttendance.openGym}
          />
        </div>
        <div className="flex flex-row justify-between text-2xl font-bold mx-5 py-4 border-b-2">
          Upcomming Classes
          <PaymentDatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 justify-center gap-4 p-4">
          {scans.map((scan, index) => (
            <ClassContainer
              key={scan.classData._id ?? index}
              classData={scan.classData}
              classScans={scan.classScans}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
