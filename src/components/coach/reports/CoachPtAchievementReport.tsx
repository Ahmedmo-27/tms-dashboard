"use client";
import { ExpiringPackagesModal, type ExpiringCategoryFilter } from '@/components/coach/reports/ExpiringPackagesModal';

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Clock,
  Layers,
  Users,
  Award,
  Wallet,
  Calendar as CalendarIcon,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import type { RootState } from "@/lib/store/store";
import { canAccessPtReport } from "@/lib/config/roles";
import { useCoachApi } from "@/hooks/useCoachApi";
import { getPtAchievementReport } from "@/lib/data/coach-portal";
import type {
  PtAchievementFilterType,
  PtAchievementParams,
  PtAchievementReport,
  CoachAchievementRow,
  BoughtPackageItem,
  DeliveredSessionItem,
  ClientBalanceItem,
  ExpiringPackageItem,
} from "@/types/coach.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type DataColumn } from "@/components/finance/data-table";
import { downloadCsv, type CsvColumn } from "@/components/finance/csv";
import { formatMoney, formatDate, formatDateTime } from "@/components/finance/format";
import { formatDisplayPhone, whatsAppHref } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";

const CAIRO_TZ = "Africa/Cairo";

function getWeekRange(date: Date) {
  const cairo = toZonedTime(date, CAIRO_TZ);
  const start = startOfWeek(cairo, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(cairo, { weekStartsOn: 1 }); // Sunday
  return {
    start: fromZonedTime(start, CAIRO_TZ),
    end: fromZonedTime(end, CAIRO_TZ),
    startKey: format(start, "yyyy-MM-dd"),
    endKey: format(end, "yyyy-MM-dd"),
    label: `${format(start, "MMM dd")} – ${format(end, "MMM dd, yyyy")}`,
  };
}

function getMonthRange(date: Date) {
  const cairo = toZonedTime(date, CAIRO_TZ);
  const start = startOfMonth(cairo);
  const end = endOfMonth(cairo);
  return {
    start: fromZonedTime(start, CAIRO_TZ),
    end: fromZonedTime(end, CAIRO_TZ),
    monthKey: format(start, "yyyy-MM"),
    label: format(start, "MMMM yyyy"),
  };
}

export function CoachPtAchievementReport() {
  const router = useRouter();
  const coachApi = useCoachApi();

  const { role, name, email, phoneNumber, coachId, capabilitiesLoaded } =
    useAppSelector((state: RootState) => state.coach);

  const isAuthorized = canAccessPtReport({
    role,
    name,
    email,
    phoneNumber,
    coachId,
  });

  useEffect(() => {
    if (capabilitiesLoaded && !isAuthorized) {
      router.replace("/coach/today");
    }
  }, [capabilitiesLoaded, isAuthorized, router]);

  // Filter state
  const [filterType, setFilterType] = useState<PtAchievementFilterType>("weekly");
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(() => new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [dateRangeInput, setDateRangeInput] = useState<{ start: string; end: string }>(() => {
    const today = new Date();
    const cairo = toZonedTime(today, CAIRO_TZ);
    const start = startOfMonth(cairo);
    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(cairo, "yyyy-MM-dd"),
    };
  });
  const [appliedDateRange, setAppliedDateRange] = useState<{ start: string; end: string }>(() => {
    const today = new Date();
    const cairo = toZonedTime(today, CAIRO_TZ);
    const start = startOfMonth(cairo);
    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(cairo, "yyyy-MM-dd"),
    };
  });

  const [selectedCoachId, setSelectedCoachId] = useState<string>("all");
  const [allCoachesList, setAllCoachesList] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [drillTab, setDrillTab] = useState<string>("packages");
  const [isExpiringModalOpen, setIsExpiringModalOpen] = useState<boolean>(false);
  const [expiringFilterType, setExpiringFilterType] = useState<ExpiringCategoryFilter>("all");
  const [expiringCoachFilter, setExpiringCoachFilter] = useState<string>("all");

  const handleOpenExpiringModal = (category: ExpiringCategoryFilter = "all", coachId = "all") => {
    setExpiringFilterType(category);
    setExpiringCoachFilter(coachId);
    setIsExpiringModalOpen(true);
  };

  // Data state
  const [data, setData] = useState<PtAchievementReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const weekInfo = useMemo(() => getWeekRange(currentWeekDate), [currentWeekDate]);
  const monthInfo = useMemo(() => getMonthRange(currentMonthDate), [currentMonthDate]);

  const periodLabel = useMemo(() => {
    if (filterType === "weekly") return weekInfo.label;
    if (filterType === "monthly") return monthInfo.label;
    return `${appliedDateRange.start} – ${appliedDateRange.end}`;
  }, [filterType, weekInfo.label, monthInfo.label, appliedDateRange]);

  // Real-time filtered coaches for the table view
  const filteredCoaches = useMemo(() => {
    if (!data?.coaches) return [];
    if (!searchQuery.trim()) return data.coaches;
    const q = searchQuery.toLowerCase().trim();
    return data.coaches.filter((c) => c.coachName.toLowerCase().includes(q));
  }, [data?.coaches, searchQuery]);

  // Aggregated expiring packages (from API or derived from active clients)
  const allExpiringPackages: ExpiringPackageItem[] = useMemo(() => {
    if (data?.expiringSoonPackages && data.expiringSoonPackages.length > 0) {
      return data.expiringSoonPackages;
    }
    // Fallback: If viewing a single coach and drilldown activeClients has items
    if (data?.selectedCoach?.activeClients) {
      return data.selectedCoach.activeClients
        .filter((c) => c.isLowBalance || c.isExpiringSoon)
        .map((c) => ({
          memberId: c.memberId,
          memberName: c.memberName,
          phone: c.phone,
          coachId: data.selectedCoach!.coachId,
          coachName: data.selectedCoach!.coachName,
          packageName: c.packageName,
          packageId: c.packageId,
          remainingSessions: c.remainingSessions,
          pkgEndDate: c.pkgEndDate,
          daysUntilExpiry: c.daysUntilExpiry,
          isLowBalance: c.isLowBalance,
          isExpiringSoon: c.isExpiringSoon,
          status: c.status,
        }));
    }
    return [];
  }, [data?.expiringSoonPackages, data?.selectedCoach]);

  // Suggestions list for the search bar dropdown
  const matchingSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const source = allCoachesList.length > 0
      ? allCoachesList
      : (data?.coaches ?? []).map((c) => ({ id: c.coachId, name: c.coachName }));
    return source.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [allCoachesList, data?.coaches, searchQuery]);

  // Build API params
  const currentParams: PtAchievementParams = useMemo(() => {
    const params: PtAchievementParams = { filterType };
    if (filterType === "weekly") {
      params.date = weekInfo.startKey;
    } else if (filterType === "monthly") {
      params.month = monthInfo.monthKey;
    } else if (filterType === "date") {
      params.startDate = appliedDateRange.start;
      params.endDate = appliedDateRange.end;
    }

    if (selectedCoachId && selectedCoachId !== "all") {
      params.coachId = selectedCoachId;
    }
    return params;
  }, [filterType, weekInfo.startKey, monthInfo.monthKey, appliedDateRange, selectedCoachId]);

  const loadReport = useCallback(async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getPtAchievementReport(coachApi, currentParams);
      setData(res);
      if (res.coaches?.length) {
        setAllCoachesList((prev) => {
          const map = new Map<string, string>();
          for (const item of prev) map.set(item.id, item.name);
          for (const c of res.coaches) map.set(c.coachId, c.coachName);
          return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load PT Achievement Report";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [coachApi, currentParams, isAuthorized]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Mode navigation
  const handlePrevPeriod = () => {
    if (filterType === "weekly") {
      setCurrentWeekDate((d) => subWeeks(d, 1));
    } else if (filterType === "monthly") {
      setCurrentMonthDate((d) => subMonths(d, 1));
    }
  };

  const handleNextPeriod = () => {
    if (filterType === "weekly") {
      setCurrentWeekDate((d) => addWeeks(d, 1));
    } else if (filterType === "monthly") {
      setCurrentMonthDate((d) => addMonths(d, 1));
    }
  };

  const handleResetToCurrent = () => {
    if (filterType === "weekly") {
      setCurrentWeekDate(new Date());
    } else if (filterType === "monthly") {
      setCurrentMonthDate(new Date());
    }
  };

  const handleApplyDateRange = () => {
    if (dateRangeInput.start && dateRangeInput.end) {
      setAppliedDateRange({ ...dateRangeInput });
    }
  };

  // CSV Export handler
  const handleExportCsv = () => {
    if (!data) return;

    const rangeLabel =
      filterType === "weekly"
        ? weekInfo.startKey
        : filterType === "monthly"
          ? monthInfo.monthKey
          : `${appliedDateRange.start}_to_${appliedDateRange.end}`;

    if (selectedCoachId === "all" || !data.selectedCoach) {
      // Export all coaches table
      const columns: CsvColumn<CoachAchievementRow>[] = [
        { header: "Coach", value: (r) => r.coachName },
        { header: "Total Sessions", value: (r) => r.sessions },
        { header: "Scan Sessions", value: (r) => r.scanSessions },
        { header: "Deduction Sessions", value: (r) => r.deductionSessions },
        { header: "Packages Sold", value: (r) => r.boughtPackages },
        { header: "Revenue (EGP)", value: (r) => r.boughtRevenue },
        { header: "Active Clients", value: (r) => r.activeClients },
        { header: "Sessions Owed", value: (r) => r.remainingSessions },
        { header: "Low Balance Clients", value: (r) => r.lowBalanceClients },
        { header: "Expiring Soon", value: (r) => r.expiringSoon },
      ];
      downloadCsv(`pt-achievement-all-coaches-${rangeLabel}.csv`, data.coaches, columns);
    } else {
      const coachNameClean = data.selectedCoach.coachName.replace(/[^a-zA-Z0-9_-]/g, "_");
      if (drillTab === "packages") {
        const columns: CsvColumn<BoughtPackageItem>[] = [
          { header: "Member", value: (r) => r.memberName },
          { header: "Phone", value: (r) => r.phone },
          { header: "Package", value: (r) => r.packageName },
          { header: "Sessions", value: (r) => r.numberOfSessions },
          { header: "Amount (EGP)", value: (r) => r.amount },
          { header: "Payment Date", value: (r) => r.paymentDate },
          { header: "Remaining Sessions", value: (r) => r.remainingSessions ?? "" },
          { header: "Status", value: (r) => r.packageStatus ?? "" },
        ];
        downloadCsv(
          `pt-${coachNameClean}-bought-packages-${rangeLabel}.csv`,
          data.selectedCoach.boughtPackages,
          columns
        );
      } else if (drillTab === "sessions") {
        const columns: CsvColumn<DeliveredSessionItem>[] = [
          { header: "Member", value: (r) => r.memberName },
          { header: "Phone", value: (r) => r.phone },
          { header: "Date", value: (r) => r.date },
          { header: "Type", value: (r) => r.source },
          { header: "Package", value: (r) => r.packageName },
          { header: "Reason", value: (r) => r.reason ?? "" },
        ];
        downloadCsv(
          `pt-${coachNameClean}-delivered-sessions-${rangeLabel}.csv`,
          data.selectedCoach.deliveredSessions,
          columns
        );
      } else if (drillTab === "clients") {
        const columns: CsvColumn<ClientBalanceItem>[] = [
          { header: "Member", value: (r) => r.memberName },
          { header: "Phone", value: (r) => r.phone },
          { header: "Package", value: (r) => r.packageName },
          { header: "Remaining Sessions", value: (r) => r.remainingSessions },
          { header: "Expiry Date", value: (r) => r.pkgEndDate },
          { header: "Days Until Expiry", value: (r) => r.daysUntilExpiry },
          { header: "Status", value: (r) => r.status },
          { header: "Low Balance", value: (r) => (r.isLowBalance ? "Yes" : "No") },
          { header: "Expiring Soon", value: (r) => (r.isExpiringSoon ? "Yes" : "No") },
        ];
        downloadCsv(
          `pt-${coachNameClean}-client-retention-${rangeLabel}.csv`,
          data.selectedCoach.activeClients,
          columns
        );
      }
    }
  };

  // Coaches table columns
  const coachColumns: DataColumn<CoachAchievementRow>[] = useMemo(
    () => [
      {
        key: "coachName",
        header: "Coach",
        cell: (row) => (
          <button
            type="button"
            onClick={() => setSelectedCoachId(row.coachId)}
            className="text-left font-medium text-primary hover:underline"
          >
            {row.coachName}
          </button>
        ),
        sortValue: (r) => r.coachName,
      },
      {
        key: "sessions",
        header: "Sessions Delivered",
        cell: (row) => (
          <div>
            <span className="font-semibold">{row.sessions}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({row.scanSessions} scan · {row.deductionSessions} ded)
            </span>
          </div>
        ),
        sortValue: (r) => r.sessions,
        align: "right",
      },
      {
        key: "boughtPackages",
        header: "Packages Sold",
        cell: (row) => <span className="font-semibold">{row.boughtPackages}</span>,
        sortValue: (r) => r.boughtPackages,
        align: "right",
      },
      {
        key: "boughtRevenue",
        header: "Revenue",
        cell: (row) => <span className="font-semibold">{formatMoney(row.boughtRevenue)}</span>,
        sortValue: (r) => r.boughtRevenue,
        align: "right",
      },
      {
        key: "activeClients",
        header: "Active Clients",
        cell: (row) => <span>{row.activeClients}</span>,
        sortValue: (r) => r.activeClients,
        align: "right",
      },
      {
        key: "remainingSessions",
        header: "Sessions Owed",
        cell: (row) => <span>{row.remainingSessions}</span>,
        sortValue: (r) => r.remainingSessions,
        align: "right",
      },
      {
        key: "lowBalanceClients",
        header: "Low Balance",
        cell: (row) => (
          <span
            className={cn(
              "font-medium",
              row.lowBalanceClients > 0 && "font-semibold text-amber-600 dark:text-amber-400"
            )}
          >
            {row.lowBalanceClients}
          </span>
        ),
        sortValue: (r) => r.lowBalanceClients,
        align: "right",
      },
      {
        key: "expiringSoon",
        header: "Expiring Soon",
        cell: (row) => (
          <span
            className={cn(
              "font-medium",
              row.expiringSoon > 0 && "font-semibold text-orange-600 dark:text-orange-400"
            )}
          >
            {row.expiringSoon}
          </span>
        ),
        sortValue: (r) => r.expiringSoon,
        align: "right",
      },
      {
        key: "actions",
        header: "",
        cell: (row) => (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setSelectedCoachId(row.coachId)}
          >
            View Details
          </Button>
        ),
        align: "right",
      },
    ],
    []
  );

  // Drill-down Bought Packages columns
  const boughtPackageColumns: DataColumn<BoughtPackageItem>[] = useMemo(
    () => [
      {
        key: "memberName",
        header: "Member",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.memberName}</p>
            {row.phone && (
              <p className="text-xs text-muted-foreground">{formatDisplayPhone(row.phone)}</p>
            )}
          </div>
        ),
        sortValue: (r) => r.memberName,
      },
      {
        key: "packageName",
        header: "Package",
        cell: (row) => <span>{row.packageName}</span>,
        sortValue: (r) => r.packageName,
      },
      {
        key: "numberOfSessions",
        header: "Sessions",
        cell: (row) => <span className="font-semibold">{row.numberOfSessions}</span>,
        sortValue: (r) => r.numberOfSessions,
        align: "right",
      },
      {
        key: "amount",
        header: "Amount",
        cell: (row) => <span className="font-semibold">{formatMoney(row.amount)}</span>,
        sortValue: (r) => r.amount,
        align: "right",
      },
      {
        key: "paymentDate",
        header: "Date",
        cell: (row) => <span className="text-xs">{formatDate(row.paymentDate)}</span>,
        sortValue: (r) => r.paymentDate,
      },
      {
        key: "remainingSessions",
        header: "Remaining",
        cell: (row) => (
          <span className="font-medium">{row.remainingSessions ?? "—"}</span>
        ),
        sortValue: (r) => r.remainingSessions ?? -1,
        align: "right",
      },
      {
        key: "packageStatus",
        header: "Status",
        cell: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "text-xs capitalize",
              row.packageStatus === "ACTIVE"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {row.packageStatus ?? "ACTIVE"}
          </Badge>
        ),
      },
    ],
    []
  );

  // Drill-down Delivered Sessions columns
  const deliveredSessionColumns: DataColumn<DeliveredSessionItem>[] = useMemo(
    () => [
      {
        key: "memberName",
        header: "Member",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.memberName}</p>
            {row.phone && (
              <p className="text-xs text-muted-foreground">{formatDisplayPhone(row.phone)}</p>
            )}
          </div>
        ),
        sortValue: (r) => r.memberName,
      },
      {
        key: "date",
        header: "Date / Time",
        cell: (row) => <span className="text-xs">{formatDateTime(row.date)}</span>,
        sortValue: (r) => r.date,
      },
      {
        key: "source",
        header: "Type",
        cell: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold",
              row.source === "SCAN"
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-400"
            )}
          >
            {row.source === "SCAN" ? "SCAN" : "DEDUCTION"}
          </Badge>
        ),
        sortValue: (r) => r.source,
      },
      {
        key: "packageName",
        header: "Package",
        cell: (row) => <span>{row.packageName}</span>,
        sortValue: (r) => r.packageName,
      },
      {
        key: "reason",
        header: "Reason",
        cell: (row) => (
          <span className="text-xs text-muted-foreground">{row.reason ?? "—"}</span>
        ),
      },
    ],
    []
  );

  // Drill-down Client Retention columns
  const clientRetentionColumns: DataColumn<ClientBalanceItem>[] = useMemo(
    () => [
      {
        key: "memberName",
        header: "Member",
        cell: (row) => <span className="font-medium">{row.memberName}</span>,
        sortValue: (r) => r.memberName,
      },
      {
        key: "phone",
        header: "Phone / WhatsApp",
        cell: (row) => {
          const wa = whatsAppHref(row.phone);
          return (
            <div className="flex items-center gap-1.5">
              <span>{formatDisplayPhone(row.phone)}</span>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open WhatsApp chat"
                  className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          );
        },
      },
      {
        key: "packageName",
        header: "Package",
        cell: (row) => <span>{row.packageName}</span>,
        sortValue: (r) => r.packageName,
      },
      {
        key: "remainingSessions",
        header: "Remaining",
        cell: (row) => (
          <span
            className={cn(
              "font-semibold",
              row.isLowBalance && "text-amber-600 dark:text-amber-400"
            )}
          >
            {row.remainingSessions}
          </span>
        ),
        sortValue: (r) => r.remainingSessions,
        align: "right",
      },
      {
        key: "pkgEndDate",
        header: "Expires",
        cell: (row) => (
          <div>
            <p className="text-xs">{formatDate(row.pkgEndDate)}</p>
            <p
              className={cn(
                "text-[11px]",
                row.isExpiringSoon
                  ? "font-medium text-orange-600 dark:text-orange-400"
                  : "text-muted-foreground"
              )}
            >
              {row.daysUntilExpiry < 0
                ? "Expired"
                : row.daysUntilExpiry === 0
                  ? "Expires today"
                  : `in ${row.daysUntilExpiry}d`}
            </p>
          </div>
        ),
        sortValue: (r) => r.daysUntilExpiry,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => {
          if (row.isLowBalance) {
            return (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs"
              >
                Low Balance
              </Badge>
            );
          }
          if (row.isExpiringSoon) {
            return (
              <Badge
                variant="outline"
                className="border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs"
              >
                Expiring Soon
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs"
            >
              {row.status || "OK"}
            </Badge>
          );
        },
      },
    ],
    []
  );

  const isDrillDown = selectedCoachId !== "all" && Boolean(data?.selectedCoach);

  if (capabilitiesLoaded && !isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 border-b bg-background/95 px-3 py-2.5 backdrop-blur-sm sm:-mx-6 sm:-mt-6 sm:px-6 sm:py-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Controls: Mode Switcher & Date Controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {/* Top row on mobile: Mode switcher & Mobile Export */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex w-full rounded-lg border bg-muted/40 p-1 text-xs sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFilterType("weekly")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1 font-medium transition-colors sm:flex-initial",
                    filterType === "weekly"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("monthly")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1 font-medium transition-colors sm:flex-initial",
                    filterType === "monthly"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("date")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1 font-medium transition-colors sm:flex-initial",
                    filterType === "date"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  By Date
                </button>
              </div>

              {/* Mobile Export CSV button (visible on mobile only, beside mode switcher) */}
              <div className="flex items-center gap-1.5 lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-xs shrink-0"
                  disabled={loading || !data}
                  onClick={handleExportCsv}
                  title="Export CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Export</span>
                </Button>
              </div>
            </div>

            {/* Date Pickers / Nav Controls */}
            {filterType === "weekly" && (
              <div className="flex items-center justify-between gap-1 sm:justify-start">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handlePrevPeriod}
                  disabled={loading}
                  title="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center text-xs font-semibold sm:min-w-[170px] sm:flex-initial sm:text-sm">
                  {weekInfo.label}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleNextPeriod}
                  disabled={loading}
                  title="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 px-2 text-xs text-muted-foreground"
                  onClick={handleResetToCurrent}
                  disabled={loading}
                >
                  This Week
                </Button>
              </div>
            )}

            {filterType === "monthly" && (
              <div className="flex items-center justify-between gap-1 sm:justify-start">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handlePrevPeriod}
                  disabled={loading}
                  title="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center text-xs font-semibold sm:min-w-[140px] sm:flex-initial sm:text-sm">
                  {monthInfo.label}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleNextPeriod}
                  disabled={loading}
                  title="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 px-2 text-xs text-muted-foreground"
                  onClick={handleResetToCurrent}
                  disabled={loading}
                >
                  This Month
                </Button>
              </div>
            )}

            {filterType === "date" && (
              <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                <Input
                  type="date"
                  className="h-8 min-w-[110px] flex-1 text-xs sm:w-32"
                  value={dateRangeInput.start}
                  onChange={(e) =>
                    setDateRangeInput((prev) => ({ ...prev, start: e.target.value }))
                  }
                  disabled={loading}
                />
                <span className="shrink-0 text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  className="h-8 min-w-[110px] flex-1 text-xs sm:w-32"
                  value={dateRangeInput.end}
                  onChange={(e) =>
                    setDateRangeInput((prev) => ({ ...prev, end: e.target.value }))
                  }
                  disabled={loading}
                />
                <Button
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 text-xs"
                  onClick={handleApplyDateRange}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Apply</span>
                </Button>
              </div>
            )}

            {loading && (
              <div className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:flex">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>

          {/* Right Actions: Coach Search & Desktop Export */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64 lg:w-60">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search coach name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="h-8 pl-8 pr-7 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    if (selectedCoachId !== "all") setSelectedCoachId("all");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Suggestions Popover */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute top-full right-0 z-50 mt-1 max-h-56 w-full min-w-[220px] overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
                  {matchingSuggestions.length > 0 ? (
                    matchingSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => {
                          setSelectedCoachId(c.id);
                          setSearchQuery(c.name);
                          setIsSearchFocused(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">View stats →</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2.5 py-2 text-center text-xs text-muted-foreground">
                      No coaches matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 gap-1.5 text-xs lg:flex"
              disabled={loading || !data}
              onClick={handleExportCsv}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Animated Top Loading Indicator */}
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden bg-primary/20">
            <div className="h-full w-2/5 animate-pulse bg-primary" />
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Card className="flex flex-col items-center justify-center gap-3 border-destructive/40 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Failed to load report</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadReport} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </Button>
        </Card>
      )}

      {/* Loading state skeleton */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="gap-2 p-4 shadow-none">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-28" />
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <div className="relative min-h-[400px]">
          {/* Subtle loading overlay when refetching existing data */}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-28 bg-background/50 backdrop-blur-[1px] transition-all duration-200">
              <div className="flex items-center gap-3 rounded-xl border bg-background/95 px-5 py-3 shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-semibold">Updating report...</p>
                  <p className="text-xs text-muted-foreground">{periodLabel}</p>
                </div>
              </div>
            </div>
          )}

          <div className={cn("transition-opacity duration-200", loading && "opacity-40 pointer-events-none")}>
            {/* View 1: All Coaches Overview */}
          {!isDrillDown ? (
            <div className="space-y-6">
              {/* KPI Stat Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Card className="gap-1 px-3 py-3 shadow-none sm:px-4 sm:py-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                    <Award className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Total PT Sessions</span>
                  </div>
                  <p className="text-xl font-bold tracking-tight sm:text-2xl">{data.totals.sessions}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight sm:text-xs">
                    {data.totals.scanSessions} scans · {data.totals.deductionSessions} ded
                  </p>
                </Card>

                <Card className="gap-1 px-3 py-3 shadow-none sm:px-4 sm:py-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                    <Wallet className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Packages Sold</span>
                  </div>
                  <p className="text-xl font-bold tracking-tight sm:text-2xl">{data.totals.boughtPackages}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight sm:text-xs truncate">
                    {formatMoney(data.totals.boughtRevenue)}
                  </p>
                </Card>

                <Card className="gap-1 px-3 py-3 shadow-none sm:px-4 sm:py-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Active Clients</span>
                  </div>
                  <p className="text-xl font-bold tracking-tight sm:text-2xl">{data.totals.activeClients}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight sm:text-xs">Active clients</p>
                </Card>

                <Card className="gap-1 px-3 py-3 shadow-none sm:px-4 sm:py-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                    <Layers className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Sessions Owed</span>
                  </div>
                  <p className="text-xl font-bold tracking-tight sm:text-2xl">
                    {data.totals.remainingSessions}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight sm:text-xs">Workload owed</p>
                </Card>

                <Card className="gap-1 border-amber-500/30 bg-amber-500/5 px-3 py-3 shadow-none sm:px-4 sm:py-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 sm:text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Low Balance</span>
                  </div>
                  <p className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 sm:text-2xl">
                    {data.totals.lowBalanceClients}
                  </p>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 leading-tight sm:text-xs">
                    Clients with ≤ 2 left
                  </p>
                </Card>

                <Card className="gap-1 border-orange-500/30 bg-orange-500/5 px-3 py-3 shadow-none sm:px-4 sm:py-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-orange-600 dark:text-orange-400 sm:text-xs">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Expiring in 7d</span>
                  </div>
                  <p className="text-xl font-bold tracking-tight text-orange-600 dark:text-orange-400 sm:text-2xl">
                    {data.totals.expiringSoon}
                  </p>
                  <p className="text-[11px] text-orange-600/80 dark:text-orange-400/80 leading-tight sm:text-xs">
                    Expiring soon
                  </p>
                </Card>
              </div>

              {/* All Coaches Section */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight sm:text-lg">Coach Achievements</h2>
                    <p className="text-xs text-muted-foreground">
                      Click any coach to drill down into package sales, delivered sessions, and active clients.
                    </p>
                  </div>
                </div>

                {/* Mobile Card List View (< md) */}
                <div className="grid gap-2.5 md:hidden">
                  {filteredCoaches.length > 0 ? (
                    filteredCoaches.map((coach) => (
                      <Card
                        key={coach.coachId}
                        className="cursor-pointer p-3.5 space-y-2.5 transition-all hover:border-primary/50"
                        onClick={() => setSelectedCoachId(coach.coachId)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">{coach.coachName}</span>
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1">
                            <span>Details</span>
                            <span className="text-[10px]">→</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/40 p-2 text-center text-xs">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Sessions</p>
                            <p className="text-sm font-bold">{coach.sessions}</p>
                            <p className="text-[9px] text-muted-foreground">{coach.scanSessions}s · {coach.deductionSessions}d</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Packages</p>
                            <p className="text-sm font-bold">{coach.boughtPackages}</p>
                            <p className="text-[9px] text-muted-foreground">sold</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Revenue</p>
                            <p className="text-xs font-bold truncate">{formatMoney(coach.boughtRevenue)}</p>
                            <p className="text-[9px] text-muted-foreground">EGP</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground pt-1 border-t">
                          <span>Clients: <strong className="text-foreground">{coach.activeClients}</strong></span>
                          <span>Owed: <strong className="text-foreground">{coach.remainingSessions}</strong></span>
                          {coach.lowBalanceClients > 0 && (
                            <span className="font-medium text-amber-600 dark:text-amber-400">Low: {coach.lowBalanceClients}</span>
                          )}
                          {coach.expiringSoon > 0 && (
                            <span className="font-medium text-orange-600 dark:text-orange-400">Exp: {coach.expiringSoon}</span>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-6 text-center text-xs text-muted-foreground">
                      {searchQuery ? `No coaches matching "${searchQuery}".` : "No coaches found for this time range."}
                    </Card>
                  )}
                </div>

                {/* Desktop/Tablet Table View (hidden on mobile, block on md+) */}
                <div className="hidden md:block">
                  <DataTable
                    columns={coachColumns}
                    rows={filteredCoaches}
                    pageSize={15}
                    emptyText={
                      searchQuery
                        ? `No coaches matching "${searchQuery}".`
                        : "No coaches found for this time range."
                    }
                    rowKey={(row) => row.coachId}
                    initialSort={{ key: "sessions", dir: "desc" }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* View 2: Drill-down View */
            <div className="space-y-6">
              {/* Drill-down Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs shrink-0"
                    onClick={() => {
                      setSelectedCoachId("all");
                      setSearchQuery("");
                    }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>All Coaches</span>
                  </Button>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold tracking-tight sm:text-xl truncate">
                      {data.selectedCoach?.coachName}
                    </h1>
                    <p className="text-xs text-muted-foreground truncate">
                      Personal Training Achievement & Activity Breakdown
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs for Coach Drill-down */}
              <Tabs value={drillTab} onValueChange={setDrillTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 max-w-lg h-9">
                  <TabsTrigger value="packages" className="px-1.5 py-1 text-xs">
                    <span className="sm:hidden">Packages</span>
                    <span className="hidden sm:inline">Bought Packages</span>
                    <span className="ml-1 text-[11px] opacity-75 font-normal">
                      ({data.selectedCoach?.boughtPackages.length ?? 0})
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="px-1.5 py-1 text-xs">
                    <span className="sm:hidden">Sessions</span>
                    <span className="hidden sm:inline">Sessions Delivered</span>
                    <span className="ml-1 text-[11px] opacity-75 font-normal">
                      ({data.selectedCoach?.deliveredSessions.length ?? 0})
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="px-1.5 py-1 text-xs">
                    <span className="sm:hidden">Retention</span>
                    <span className="hidden sm:inline">Client Retention</span>
                    <span className="ml-1 text-[11px] opacity-75 font-normal">
                      ({data.selectedCoach?.activeClients.length ?? 0})
                    </span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Bought Packages */}
                <TabsContent value="packages" className="space-y-4">
                  <DataTable
                    columns={boughtPackageColumns}
                    rows={data.selectedCoach?.boughtPackages ?? []}
                    pageSize={15}
                    emptyText="No packages bought for this coach during this period."
                    rowKey={(row) => row.paymentId}
                    initialSort={{ key: "paymentDate", dir: "desc" }}
                  />
                </TabsContent>

                {/* Tab 2: Sessions Delivered */}
                <TabsContent value="sessions" className="space-y-4">
                  <DataTable
                    columns={deliveredSessionColumns}
                    rows={data.selectedCoach?.deliveredSessions ?? []}
                    pageSize={15}
                    emptyText="No delivered sessions recorded for this period."
                    rowKey={(row) => row.id}
                    initialSort={{ key: "date", dir: "desc" }}
                  />
                </TabsContent>

                {/* Tab 3: Client Retention */}
                <TabsContent value="clients" className="space-y-4">
                  <DataTable
                    columns={clientRetentionColumns}
                    rows={data.selectedCoach?.activeClients ?? []}
                    pageSize={15}
                    emptyText="No active clients with remaining balances."
                    rowKey={(row) => `${row.memberId}-${row.packageId}`}
                    initialSort={{ key: "remainingSessions", dir: "asc" }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
