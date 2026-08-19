"use client";
import {
  ClassContainer,
  ClassContainerProps,
  ClassScan,
} from "./class-container";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate, isToday, isPast, startOfDay } from "date-fns";
import { PaymentDatePicker } from "../payments/date-picker";
import { AttendanceContainer } from "./attendance-container";
import AddGuestPackage from "../dialogs/package/add-guest-package";
import { OpenGymDropInDialog } from "../dialogs/open-gym/open-gym-drop-in-dialog";
import { OpenGymSubscribeDialog } from "../dialogs/open-gym/open-gym-subscribe-dialog";
import { fetchScansMonitorData } from "@/lib/data/scans";
import {
  mapOpenGymMethodToSheetLabel,
  mapPtMethodToSheetLabel,
} from "@/lib/utils/copy-class-for-sheet";
import { Class } from "../classes/columns";
import {
  createTmsSocket,
  formatFailedScanToast,
  type FailedScanPayload,
} from "@/lib/socket";
import { useBranchContext } from "@/lib/hooks/use-branch-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

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

type ScanAction = "add-package" | "drop-in" | "subscribe" | "guest" | null;

export function ScanContainer({
  scans: initialScans,
  dailyAttendance: initialDailyAttendance,
  packages,
  classes: _classes = [],
}: {
  scans: ClassContainerProps[];
  dailyAttendance: { pt: ClassScan[]; openGym: ClassScan[] };
  packages: any;
  classes?: Class[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isViewingAllBranches } = useBranchContext();

  const [scans, setScans] = useState(initialScans);
  const [dailyAttendance, setDailyAttendance] = useState(initialDailyAttendance);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parseDateParam(searchParams.get("date") ?? searchParams.get("checkInsDate"))
  );
  const [action, setAction] = useState<ScanAction>(
    () => (searchParams.get("action") as ScanAction) ?? null
  );

  useEffect(() => {
    setScans(initialScans);
    setDailyAttendance(initialDailyAttendance);
  }, [initialScans, initialDailyAttendance]);

  useEffect(() => {
    const nextAction = searchParams.get("action") as ScanAction;
    if (nextAction) {
      setAction(nextAction);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      const query = params.toString();
      router.replace(
        query ? `/dashboard/scans-monitor?${query}` : "/dashboard/scans-monitor"
      );
    }
  }, [router, searchParams]);

  const fetchAll = useCallback(async (date: Date, silent = false) => {
    try {
      const data = await fetchScansMonitorData(date, date);
      setScans(data.scans);
      setDailyAttendance(data.dailyAttendance);
    } catch {
      if (!silent) {
        toast.error("Failed to refresh scans.");
      }
    }
  }, []);

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatDate(date, "yyyy-MM-dd"));
    params.delete("checkInsDate");
    window.history.replaceState(
      null,
      "",
      `/dashboard/scans-monitor?${params.toString()}`
    );
    fetchAll(date);
  };

  useEffect(() => {
    const socket = createTmsSocket();

    const handleRefresh = () => fetchAll(selectedDate, true);

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
  }, [selectedDate, fetchAll]);

  const viewingToday = isToday(selectedDate);
  const viewingPast = isPast(startOfDay(selectedDate)) && !viewingToday;

  return (
    <div className="p-4 sm:p-5 space-y-5">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Today</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Check-ins and classes for{" "}
              {formatDate(selectedDate, "EEE d MMM")}
            </p>
          </div>
          <span
            className={`text-xs font-normal px-2 py-1 rounded-full ${
              socketConnected
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
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
          <PaymentDatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                Quick actions
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setAction("add-package")}>
                Add package
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAction("drop-in")}>
                Open gym drop-in
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAction("subscribe")}>
                Subscribe to open gym
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAction("guest")}>
                Guest package
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <OpenGymSubscribeDialog
        packages={packages}
        hideTrigger
        mode="all"
        open={action === "add-package"}
        onOpenChange={(next) => setAction(next ? "add-package" : null)}
      />
      <OpenGymDropInDialog
        hideTrigger
        open={action === "drop-in"}
        onOpenChange={(next) => setAction(next ? "drop-in" : null)}
      />
      <OpenGymSubscribeDialog
        packages={packages}
        hideTrigger
        open={action === "subscribe"}
        onOpenChange={(next) => setAction(next ? "subscribe" : null)}
      />
      <AddGuestPackage
        packages={packages}
        hideTrigger
        open={action === "guest"}
        onOpenChange={(next) => setAction(next ? "guest" : null)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 justify-center gap-4">
        <AttendanceContainer
          title="Personal Training"
          classScans={dailyAttendance.pt}
          showBranch={isViewingAllBranches}
          sheetCopy={{ mapMethod: mapPtMethodToSheetLabel }}
        />
        <AttendanceContainer
          title="Open Gym"
          classScans={dailyAttendance.openGym}
          showBranch={isViewingAllBranches}
          sheetCopy={{ mapMethod: mapOpenGymMethodToSheetLabel }}
          headerActions={
            <OpenGymDropInDialog
              triggerLabel="Add drop-in"
              triggerClassName="min-h-[36px]"
            />
          }
        />
      </div>

      <div className="flex flex-row items-end justify-between border-b pb-3">
        <div>
          <h2 className="text-xl font-semibold">Upcoming classes</h2>
          <p className="text-xs text-muted-foreground">
            {scans.length} class{scans.length === 1 ? "" : "es"} this day
          </p>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {viewingPast
            ? "No classes were scheduled for this day."
            : "No classes scheduled for this day."}{" "}
          <Link href="/dashboard/schedule" className="text-primary underline">
            Open Schedule
          </Link>{" "}
          to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 justify-center gap-4">
          {scans.map((scan, index) => (
            <ClassContainer
              key={scan.classData._id ?? index}
              classData={scan.classData}
              classScans={scan.classScans}
              showBranch={isViewingAllBranches}
              onRefresh={() => fetchAll(selectedDate, true)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
