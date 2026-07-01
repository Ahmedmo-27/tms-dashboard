"use client";
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
import { Class } from "../classes/columns";
import {
  createTmsSocket,
  formatFailedScanToast,
  type FailedScanPayload,
} from "@/lib/socket";

function parseDateParam(value: string | null): Date {
  return value ? new Date(value) : new Date();
}

const failedScanToastStyle = {
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
};

export function ScanContainer({
  scans: initialScans,
  dailyAttendance: initialDailyAttendance,
  packages,
  classes = [],
}: {
  scans: ClassContainerProps[];
  dailyAttendance: { pt: ClassScan[]; openGym: ClassScan[] };
  packages: any;
  classes?: Class[];
}) {
  const searchParams = useSearchParams();

  const [scans, setScans] = useState(initialScans);
  const [dailyAttendance, setDailyAttendance] = useState(initialDailyAttendance);
  const [socketConnected, setSocketConnected] = useState(false);
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
    const socket = createTmsSocket();

    const handleRefresh = () =>
      fetchAll(selectedDate, selectedCheckInsDate, true);

    const handleFailedScan = (payload: FailedScanPayload) => {
      toast.error(formatFailedScanToast(payload), failedScanToastStyle);
      handleRefresh();
    };

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("SUCCESS-SCAN", handleRefresh);
    socket.on("FAILED-SCAN", handleFailedScan);

    if (socket.connected) {
      setSocketConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("SUCCESS-SCAN", handleRefresh);
      socket.off("FAILED-SCAN", handleFailedScan);
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [selectedDate, selectedCheckInsDate, fetchAll]);

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex flex-row justify-between text-2xl font-bold mx-5 py-4 border-b-2">
          <div className="flex items-center gap-3">
            Check Ins
            <span
              className={`text-xs font-normal px-2 py-1 rounded-full ${
                socketConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
              title={
                socketConnected
                  ? "Live scan updates connected"
                  : "Live scan updates disconnected — error toasts may not appear"
              }
            >
              {socketConnected ? "Live" : "Offline"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OpenGymPricingDialog packages={packages} classes={classes} />
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
