"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoachApi } from "@/hooks/useCoachApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronLeft, Clock, Dumbbell, MapPin, X } from "lucide-react";
import { format } from "date-fns";
import { DeductionModal } from "@/components/coach/DeductionModal";
import {
  getCoachDeductions,
  getCoachClientAttendance,
} from "@/lib/data/coach-portal";
import type {
  DeductionHistoryItemDto,
  ClientAttendanceItemDto,
} from "@/types/coach.types";
import { telHref } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import toast from "react-hot-toast";

export interface MemberPackageData {
  pkgId: string;
  pkgStartDate: string;
  pkgEndDate: string;
  remainingClasses: number;
  totalClasses?: number;
  status: string;
  isExpired: boolean;
  daysUntilExpiry: number;
  name?: string;
  isPtPackage?: boolean;
}

interface PackageDetailProps {
  memberId: string;
}

function StatusBadge({
  isExpired,
  daysUntilExpiry,
}: {
  isExpired: boolean;
  daysUntilExpiry: number;
}) {
  if (isExpired) {
    return (
      <Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Expired
      </Badge>
    );
  }
  if (daysUntilExpiry <= 14) {
    return (
      <Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Expiring soon
      </Badge>
    );
  }
  return (
    <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Active
    </Badge>
  );
}

function PackageCard({
  pkg,
  onDeduct,
}: {
  pkg: MemberPackageData;
  onDeduct?: () => void;
}) {
  const label = pkg.name ?? `Package ${pkg.pkgId}`;
  const endDate = format(new Date(pkg.pkgEndDate), "dd MMM yyyy");
  const progressValue =
    pkg.totalClasses && pkg.totalClasses > 0
      ? Math.round((pkg.remainingClasses / pkg.totalClasses) * 100)
      : null;

  return (
    <div data-walkthrough="coach-package-card" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm leading-tight font-semibold">{label}</p>
        <StatusBadge isExpired={pkg.isExpired} daysUntilExpiry={pkg.daysUntilExpiry} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Classes remaining</span>
          <span className="font-medium text-foreground">
            {pkg.isPtPackage && pkg.totalClasses
              ? `${pkg.remainingClasses} out of ${pkg.totalClasses} remaining`
              : `${pkg.remainingClasses}${pkg.totalClasses ? ` / ${pkg.totalClasses}` : ""}`}
          </span>
        </div>
        {progressValue !== null ? (
          <Progress value={progressValue} className="h-2" />
        ) : (
          <div className="h-2 rounded-full bg-muted" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Expires: <span className="font-medium text-foreground">{endDate}</span>
      </p>
      {pkg.isPtPackage && onDeduct && (
        <Button
          size="sm"
          variant="outline"
          data-walkthrough="coach-package-deduct-btn"
          className="mt-auto w-full"
          disabled={pkg.isExpired || pkg.remainingClasses === 0}
          onClick={onDeduct}
        >
          Deduct class
        </Button>
      )}
    </div>
  );
}

function getDeductionSourceBadge(source?: string) {
  switch (source) {
    case "COACH":
      return (
        <Badge
          variant="outline"
          className="shrink-0 border-emerald-300 bg-emerald-50 text-xs font-normal text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          Coach
        </Badge>
      );
    case "PT_ATTENDANCE":
      return (
        <Badge
          variant="outline"
          className="shrink-0 border-purple-300 bg-purple-50 text-xs font-normal text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
        >
          PT Attendance
        </Badge>
      );
    case "ATTENDANCE":
      return (
        <Badge
          variant="outline"
          className="shrink-0 border-sky-300 bg-sky-50 text-xs font-normal text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
        >
          Attendance
        </Badge>
      );
    case "ADMIN":
      return (
        <Badge
          variant="outline"
          className="shrink-0 border-blue-300 bg-blue-50 text-xs font-normal text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
        >
          Manual
        </Badge>
      );
    default:
      return null;
  }
}

const ATTENDANCE_PAGE_SIZE = 10;
const DEDUCTIONS_PAGE_SIZE = 10;

export function PackageDetail({ memberId }: PackageDetailProps) {
  const coachApi = useCoachApi();
  const router = useRouter();
  const [memberName, setMemberName] = useState("");
  const [phone, setPhone] = useState("");
  const [packages, setPackages] = useState<MemberPackageData[]>([]);
  const [history, setHistory] = useState<DeductionHistoryItemDto[]>([]);
  const [attendance, setAttendance] = useState<ClientAttendanceItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [deductTarget, setDeductTarget] = useState<MemberPackageData | null>(null);

  // Attendance filters & pagination
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PT" | "CLASS">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [attendancePage, setAttendancePage] = useState(0);

  // Deduction filters & pagination
  const [deductFromDate, setDeductFromDate] = useState("");
  const [deductToDate, setDeductToDate] = useState("");
  const [deductPkgId, setDeductPkgId] = useState("ALL");
  const [deductionsPage, setDeductionsPage] = useState(0);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pkgRes, deductions, attendanceHistory] = await Promise.all([
          coachApi.get(`/api/coach/clients/${memberId}/packages`),
          getCoachDeductions(coachApi, memberId).catch(() => [] as DeductionHistoryItemDto[]),
          getCoachClientAttendance(coachApi, memberId).catch(() => [] as ClientAttendanceItemDto[]),
        ]);
        const raw = pkgRes.data.data?.packages;
        const member = pkgRes.data.data?.member;
        if (member?.name) setMemberName(member.name);
        if (member?.phoneNumber) setPhone(member.phoneNumber);
        setPackages(Array.isArray(raw) ? (raw as MemberPackageData[]) : []);
        setHistory(deductions);
        setAttendance(attendanceHistory);
      } catch (err: any) {
        const code = err?.response?.data?.code || err?.context?.code;
        const msg =
          code === "ACCESS_DENIED"
            ? "You do not have permission to view this client's packages."
            : code === "MEMBER_NOT_FOUND"
            ? "Member profile not found."
            : err?.response?.data?.message || err?.context?.message || "Failed to load packages.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [memberId, coachApi, reloadKey]);

  const handlePackageUpdated = (updated: MemberPackageData) => {
    setPackages((prev) =>
      prev.map((p) => (p.pkgStartDate === updated.pkgStartDate ? { ...p, ...updated } : p))
    );
    getCoachDeductions(coachApi, memberId)
      .then(setHistory)
      .catch(() => undefined);
    getCoachClientAttendance(coachApi, memberId)
      .then(setAttendance)
      .catch(() => undefined);
  };

  const hasBothTypes = useMemo(() => {
    const hasPt = attendance.some((a) => a.type === "PT");
    const hasClass = attendance.some((a) => a.type === "CLASS");
    return hasPt && hasClass;
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    return attendance
      .filter((rec) => {
        if (typeFilter !== "ALL" && rec.type !== typeFilter) return false;
        if (!fromDate && !toDate) return true;
        const d = new Date(rec.date).getTime();
        const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
        const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Infinity;
        return d >= from && d <= to;
      })
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
  }, [attendance, typeFilter, fromDate, toDate]);

  const hasFilter = typeFilter !== "ALL" || Boolean(fromDate) || Boolean(toDate);

  const attendancePageCount = Math.ceil(
    filteredAttendance.length / ATTENDANCE_PAGE_SIZE
  );
  const safeAttendancePage =
    attendancePage >= attendancePageCount && attendancePageCount > 0
      ? attendancePageCount - 1
      : attendancePage;
  const paginatedAttendance = filteredAttendance.slice(
    safeAttendancePage * ATTENDANCE_PAGE_SIZE,
    (safeAttendancePage + 1) * ATTENDANCE_PAGE_SIZE
  );

  const uniquePkgOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of packages) {
      if (p.pkgId) map.set(p.pkgId, p.name || `Package ${p.pkgId}`);
    }
    for (const h of history) {
      if (h.pkgId && !map.has(h.pkgId)) {
        map.set(h.pkgId, h.packageName || `Package ${h.pkgId}`);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [packages, history]);

  const filteredHistory = useMemo(() => {
    return history
      .filter((rec) => {
        if (deductPkgId !== "ALL" && rec.pkgId !== deductPkgId) return false;
        if (!deductFromDate && !deductToDate) return true;
        const d = new Date(rec.sessionDate).getTime();
        const from = deductFromDate ? new Date(deductFromDate).getTime() : -Infinity;
        const to = deductToDate ? new Date(`${deductToDate}T23:59:59`).getTime() : Infinity;
        return d >= from && d <= to;
      })
      .sort(
        (a, b) =>
          new Date(b.sessionDate || b.createdAt || 0).getTime() -
          new Date(a.sessionDate || a.createdAt || 0).getTime()
      );
  }, [history, deductPkgId, deductFromDate, deductToDate]);

  const hasDeductFilter =
    deductPkgId !== "ALL" || Boolean(deductFromDate) || Boolean(deductToDate);

  const deductionsPageCount = Math.ceil(
    filteredHistory.length / DEDUCTIONS_PAGE_SIZE
  );
  const safeDeductionsPage =
    deductionsPage >= deductionsPageCount && deductionsPageCount > 0
      ? deductionsPageCount - 1
      : deductionsPage;
  const paginatedHistory = filteredHistory.slice(
    safeDeductionsPage * DEDUCTIONS_PAGE_SIZE,
    (safeDeductionsPage + 1) * DEDUCTIONS_PAGE_SIZE
  );

  const active = packages.filter((p) => !p.isExpired);
  const past = packages.filter((p) => p.isExpired);
  const tel = telHref(phone);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back to client list"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          {loading && !memberName ? (
            <div className="space-y-2">
              <div className="h-5 w-36 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <>
              <h2 className="font-semibold">{memberName || "Client"}</h2>
              {tel ? (
                <a href={tel} className="text-xs text-muted-foreground hover:underline">
                  {phone}
                </a>
              ) : phone ? (
                <p className="text-xs text-muted-foreground">{phone}</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3.5 w-16 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : error && packages.length === 0 && attendance.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          {packages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              This member has no PT packages assigned with you.
            </div>
          ) : (
            <div className="space-y-4">
              {active.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((pkg) => (
                    <PackageCard
                      key={`${pkg.pkgId}-${pkg.pkgStartDate}`}
                      pkg={pkg}
                      onDeduct={() => setDeductTarget(pkg)}
                    />
                  ))}
                </div>
              )}

              {past.length > 0 && (
                <details className="rounded-lg border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Past packages ({past.length})
                  </summary>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {past.map((pkg) => (
                      <PackageCard key={`${pkg.pkgId}-${pkg.pkgStartDate}`} pkg={pkg} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Attendance History Section */}
          <div data-walkthrough="coach-client-attendance-history" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Attendance history</h3>
                <Badge variant="secondary" className="text-xs font-normal">
                  {attendance.length}
                </Badge>
              </div>
            </div>

            {attendance.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {hasBothTypes && (
                  <div className="flex items-center gap-1 mr-2">
                    {(["ALL", "PT", "CLASS"] as const).map((t) => (
                      <Button
                        key={t}
                        type="button"
                        size="sm"
                        variant={typeFilter === t ? "default" : "outline"}
                        className="h-7 rounded-full px-3 text-xs"
                        onClick={() => {
                          setTypeFilter(t);
                          setAttendancePage(0);
                        }}
                      >
                        {t === "ALL" ? "All" : t === "PT" ? "PT" : "Classes"}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">
                    From
                  </label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setAttendancePage(0);
                    }}
                    className="h-7 w-36 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">
                    To
                  </label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setAttendancePage(0);
                    }}
                    className="h-7 w-36 text-xs"
                  />
                </div>
                {hasFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => {
                      setTypeFilter("ALL");
                      setFromDate("");
                      setToDate("");
                      setAttendancePage(0);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No attendance records yet.
              </p>
            ) : filteredAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No attendance records match the selected filters.
              </p>
            ) : (
              <div className="divide-y overflow-hidden rounded-lg border">
                {paginatedAttendance.map((item) => {
                  const dateObj = new Date(item.date);
                  const validDate = !isNaN(dateObj.getTime());
                  const formattedDate = validDate
                    ? format(dateObj, "dd MMM yyyy")
                    : "";
                  const formattedTime = validDate
                    ? format(dateObj, "hh:mm a")
                    : "";

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            item.type === "PT"
                              ? "bg-primary/10 text-primary"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          )}
                        >
                          {item.type === "PT" ? (
                            <Dumbbell className="h-4 w-4" />
                          ) : (
                            <Calendar className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {formattedDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formattedDate}
                              </span>
                            )}
                            {formattedTime && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formattedTime}
                              </span>
                            )}
                            {item.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="shrink-0 text-xs font-normal"
                      >
                        {item.type === "CLASS"
                          ? "Class"
                          : item.method || "PT"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredAttendance.length > 0 && (
              <TablePagination
                pageIndex={safeAttendancePage}
                pageCount={attendancePageCount}
                total={filteredAttendance.length}
                pageSize={ATTENDANCE_PAGE_SIZE}
                onPageChange={setAttendancePage}
              />
            )}
          </div>

          {/* Deduction History Section */}
          <div data-walkthrough="coach-client-deduction-history" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Deduction history</h3>
                <Badge variant="secondary" className="text-xs font-normal">
                  {history.length}
                </Badge>
              </div>
            </div>

            {history.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {uniquePkgOptions.length > 1 && (
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">
                      Package
                    </label>
                    <select
                      value={deductPkgId}
                      onChange={(e) => {
                        setDeductPkgId(e.target.value);
                        setDeductionsPage(0);
                      }}
                      className="h-7 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option value="ALL">All Packages</option>
                      {uniquePkgOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">
                    From
                  </label>
                  <Input
                    type="date"
                    value={deductFromDate}
                    onChange={(e) => {
                      setDeductFromDate(e.target.value);
                      setDeductionsPage(0);
                    }}
                    className="h-7 w-36 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">
                    To
                  </label>
                  <Input
                    type="date"
                    value={deductToDate}
                    onChange={(e) => {
                      setDeductToDate(e.target.value);
                      setDeductionsPage(0);
                    }}
                    className="h-7 w-36 text-xs"
                  />
                </div>
                {hasDeductFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => {
                      setDeductPkgId("ALL");
                      setDeductFromDate("");
                      setDeductToDate("");
                      setDeductionsPage(0);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deductions yet.</p>
            ) : filteredHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No deductions match the selected filters.
              </p>
            ) : (
              <div className="divide-y overflow-hidden rounded-lg border">
                {paginatedHistory.map((item) => {
                  const pkgTotal =
                    item.totalClasses ??
                    (item.pkgId
                      ? packages.find((p) => p.pkgId === item.pkgId)?.totalClasses
                      : undefined);
                  const pkgName =
                    item.packageName ||
                    (item.pkgId
                      ? packages.find((p) => p.pkgId === item.pkgId)?.name
                      : undefined);

                  const sessionDateObj = new Date(item.sessionDate);
                  const validDate = !isNaN(sessionDateObj.getTime());
                  const formattedDate = validDate
                    ? format(sessionDateObj, "dd MMM yyyy")
                    : "";
                  const formattedTime = validDate
                    ? format(sessionDateObj, "hh:mm a")
                    : "";

                  const displayReason =
                    (item.source === "PT_ATTENDANCE" && pkgName && !item.reason?.includes(pkgName)) ||
                    !item.reason
                      ? `PT attendance: ${pkgName || "PT Session"}`
                      : item.reason;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            item.source === "COACH"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : item.source === "PT_ATTENDANCE"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : item.source === "ATTENDANCE"
                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {item.source === "COACH" ? (
                            <Dumbbell className="h-4 w-4" />
                          ) : item.source === "ATTENDANCE" ? (
                            <Calendar className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium">{displayReason}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {pkgName && (
                              <span className="font-medium text-foreground">
                                {pkgName}
                              </span>
                            )}
                            {formattedDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formattedDate}
                              </span>
                            )}
                            {formattedTime && formattedTime !== "12:00 AM" && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formattedTime}
                              </span>
                            )}
                            <span>
                              {pkgTotal
                                ? `${item.classesRemainingAfter} out of ${pkgTotal} remaining after`
                                : `${item.classesRemainingAfter} remaining after`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {getDeductionSourceBadge(item.source)}
                    </div>
                  );
                })}
              </div>
            )}

            {filteredHistory.length > 0 && (
              <TablePagination
                pageIndex={safeDeductionsPage}
                pageCount={deductionsPageCount}
                total={filteredHistory.length}
                pageSize={DEDUCTIONS_PAGE_SIZE}
                onPageChange={setDeductionsPage}
              />
            )}
          </div>
        </>
      )}

      {deductTarget && (
        <DeductionModal
          open
          memberId={memberId}
          memberName={memberName}
          remainingClasses={deductTarget.remainingClasses}
          totalClasses={deductTarget.totalClasses}
          memberPackageStartDate={deductTarget.pkgStartDate}
          pkgId={deductTarget.pkgId}
          pkgName={deductTarget.name}
          onClose={() => setDeductTarget(null)}
          onSuccess={handlePackageUpdated}
        />
      )}
    </div>
  );
}
