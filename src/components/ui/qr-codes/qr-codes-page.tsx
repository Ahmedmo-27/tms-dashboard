"use client";

import {
  Fragment,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import QRTemplateGenerator from "@/components/ui/qrcode-template";
import SpaceQRCode from "@/components/ui/space-qrcode";
import { PaymentDatePicker } from "@/components/ui/payments/date-picker";
import { getScheduledClasses } from "@/lib/data/schedule";
import type { Location } from "@/lib/data/locations";
import type { ScheduledClass } from "@/components/ui/schedule/columns";
import { useBranchContext } from "@/lib/hooks/use-branch-context";

interface QRCodesPageProps {
  locations: Location[];
  scheduledClasses: ScheduledClass[];
  initialDate?: string;
}

function parseDateParam(value: string | null | undefined): Date {
  if (!value) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return new Date(`${value.trim()}T00:00:00`);
  }
  return new Date(value);
}

function QRCodesPageInner({
  locations,
  scheduledClasses: initialScheduledClasses,
  initialDate,
}: QRCodesPageProps) {
  const searchParams = useSearchParams();
  const { effectiveLocationId } = useBranchContext();

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parseDateParam(searchParams?.get("date") ?? initialDate)
  );
  const [classes, setClasses] = useState<ScheduledClass[]>(
    initialScheduledClasses
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setClasses(initialScheduledClasses);
  }, [initialScheduledClasses]);

  const fetchClassesForDate = useCallback(
    async (targetDate: Date) => {
      setIsLoading(true);
      try {
        const dateStr = formatInTimeZone(
          targetDate,
          "Africa/Cairo",
          "yyyy-MM-dd"
        );
        const data = await getScheduledClasses(
          effectiveLocationId || undefined,
          dateStr
        );
        setClasses(data);
      } catch (error) {
        console.error("Failed to load scheduled classes for QR codes", error);
        toast.error("Failed to load schedule for selected date");
      } finally {
        setIsLoading(false);
      }
    },
    [effectiveLocationId]
  );

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    setSelectedDate(newDate);
    const dateStr = formatInTimeZone(newDate, "Africa/Cairo", "yyyy-MM-dd");
    if (typeof window !== "undefined") {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("date", dateStr);
      window.history.replaceState(
        null,
        "",
        `/dashboard/qr-codes?${currentParams.toString()}`
      );
    }
    fetchClassesForDate(newDate);
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchClassesForDate(selectedDate);
  }, [effectiveLocationId, fetchClassesForDate, selectedDate]);

  const visibleLocations = effectiveLocationId
    ? locations.filter((loc) => loc._id === effectiveLocationId)
    : locations;

  const visibleLocationIds = useMemo(
    () => new Set(visibleLocations.map((l) => l._id)),
    [visibleLocations]
  );
  const visibleBranchNames = useMemo(
    () => new Set(visibleLocations.map((l) => l.branchName)),
    [visibleLocations]
  );

  const targetDateStr = formatInTimeZone(
    selectedDate,
    "Africa/Cairo",
    "yyyy-MM-dd"
  );
  const todayCairoStr = formatInTimeZone(
    new Date(),
    "Africa/Cairo",
    "yyyy-MM-dd"
  );
  const isTodayDate = targetDateStr === todayCairoStr;

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const clsDateStr = formatInTimeZone(
        new Date(cls.startTime),
        "Africa/Cairo",
        "yyyy-MM-dd"
      );
      if (clsDateStr !== targetDateStr) return false;

      return (
        (cls.locationId && visibleLocationIds.has(cls.locationId)) ||
        (cls.location && visibleBranchNames.has(cls.location))
      );
    });
  }, [classes, targetDateStr, visibleLocationIds, visibleBranchNames]);

  if (locations.length === 0) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          No locations available. Add a branch before generating QR codes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div data-walkthrough="qr-type-selector">
        <h2 className="text-lg font-bold mb-4">Static QR Codes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleLocations.map((loc) => (
            <Fragment key={loc._id}>
              <SpaceQRCode
                locationId={loc._id}
                branchName={loc.branchName}
                kind="openGym"
              />
              <SpaceQRCode
                locationId={loc._id}
                branchName={loc.branchName}
                kind="pt"
              />
            </Fragment>
          ))}
        </div>
      </div>

      <div data-walkthrough="qr-preview-card" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              {isTodayDate
                ? "Today's Classes"
                : `Classes for ${format(selectedDate, "EEE, MMM d, yyyy")}`}
              {visibleLocations.length === 1
                ? ` — ${visibleLocations[0].branchName}`
                : ""}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select a date to view and download QR codes for scheduled classes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PaymentDatePicker
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-card/40 p-8 text-center animate-in fade-in-50 duration-200">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Loading scheduled classes for {format(selectedDate, "MMM d, yyyy")}...
            </p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <p className="text-muted-foreground">
            {isTodayDate
              ? "No classes scheduled for this location today."
              : `No classes scheduled for this location on ${format(selectedDate, "EEE, MMM d, yyyy")}.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClasses.map((cls) => (
              <QRTemplateGenerator key={cls._id} scls={cls} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function QRCodesPage(props: QRCodesPageProps) {
  return (
    <Suspense>
      <QRCodesPageInner {...props} />
    </Suspense>
  );
}
