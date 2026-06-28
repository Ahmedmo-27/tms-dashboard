"use client";
import { io } from "socket.io-client";
import {
  ClassContainer,
  ClassContainerProps,
  ClassScan,
} from "./class-container";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatDate } from "date-fns";
import { PaymentDatePicker } from "../payments/date-picker";
import { AttendanceContainer } from "./attendance-container";
import AddGuestPackage from "../dialogs/package/add-guest-package";
import { OpenGymDropInDialog } from "../dialogs/open-gym/open-gym-drop-in-dialog";
import { OpenGymSubscribeDialog } from "../dialogs/open-gym/open-gym-subscribe-dialog";

interface ScanError {
  code: string;
  message: string;
  time: string;
}

const socket = io(process.env.NEXT_PUBLIC_TMS_API_URL!, {
  transports: ["websocket"],
});

export function ScanContainer({
  scans,
  dailyAttendance,
  packages,
}: {
  scans: ClassContainerProps[];
  dailyAttendance: { pt: ClassScan[]; openGym: ClassScan[] };
  packages: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedCheckInsDate, setSelectedCheckInsDate] = useState<
    Date | undefined
  >(new Date());

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);

    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      // Convert to UTC date string (YYYY-MM-DD format)
      const utcDateString = formatDate(date, "yyyy-MM-dd");
      params.set("date", utcDateString);
    } else {
      params.delete("date");
    }

    // Navigate to new URL
    router.push(`/dashboard/scans-monitor?${params.toString()}`);
  };

  const handleCheckInsDateChange = (date: Date | undefined) => {
    setSelectedCheckInsDate(date);

    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      // Convert to UTC date string (YYYY-MM-DD format)
      const utcDateString = formatDate(date, "yyyy-MM-dd");
      params.set("checkInsDate", utcDateString);
    } else {
      params.delete("checkInsDate");
    }

    // Navigate to new URL
    router.push(`/dashboard/scans-monitor?${params.toString()}`);
  };

  const handleRefresh = () => {
    const scrollY = window.scrollY;
    router.refresh();

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("SUCCESS-SCAN", () => {
      console.log("SUCCESS-SCAN");
      handleRefresh();
    });

    socket.on(
      "FAILED-SCAN",
      (payload: { code: string; member: string; message: string }) => {
        console.log("Failed Scan");
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
      socket.off("connect");
      socket.off("SUCCESS-SCAN");
      socket.off("FAILED-SCAN");
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex flex-row justify-between text-2xl font-bold mx-5 py-4 border-b-2">
          Check Ins
          <div className="flex space-x-2">
            <AddGuestPackage packages={packages} openGymOnly />
            <OpenGymSubscribeDialog packages={packages} />
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
            headerActions={
              <OpenGymDropInDialog
                triggerLabel="Add drop-in"
                triggerClassName="min-h-[36px]"
              />
            }
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
              key={index}
              classData={scan.classData}
              classScans={scan.classScans}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
