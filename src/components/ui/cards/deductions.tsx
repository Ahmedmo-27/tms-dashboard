"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Package as PackageIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AdjustmentRecord, MemberPackage } from "../members/columns";
import { SOURCE_COLORS, SOURCE_LABELS } from "./packages";
import { TablePagination } from "@/components/ui/table-pagination";

const DEDUCTIONS_PAGE_SIZE = 10;

type SourceFilter = "ALL" | "ATTENDANCE" | "BOOKING" | "MANUAL" | "CANCELLATION";

function matchesSourceFilter(rec: AdjustmentRecord, filter: SourceFilter): boolean {
  if (filter === "ALL") return true;
  const reasonLower = (rec.reason || "").trim().toLowerCase();
  const isCompletedSession =
    (rec.source === "COACH" || rec.source === "ADMIN") &&
    (reasonLower.startsWith("completed session") ||
      reasonLower.startsWith("makeup") ||
      reasonLower.startsWith("attended"));

  if (filter === "ATTENDANCE") {
    return (
      rec.source === "PT_ATTENDANCE" ||
      rec.source === "ATTENDANCE" ||
      rec.source === "SPACE_WALK" ||
      isCompletedSession
    );
  }
  if (filter === "BOOKING") {
    return rec.source === "BOOKING";
  }
  if (filter === "MANUAL") {
    return rec.source === "ADMIN" || rec.source === "COACH";
  }
  if (filter === "CANCELLATION") {
    return (
      rec.source === "MEMBER_CANCELLATION" ||
      rec.source === "FRONTDESK_CANCELLATION"
    );
  }
  return true;
}

export default function Deductions({
  memberPackages,
  deductions,
  hideHeader = false,
}: {
  memberPackages: MemberPackage[];
  deductions?: AdjustmentRecord[];
  hideHeader?: boolean;
}) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [pkgFilter, setPkgFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  const allRecords = useMemo(() => {
    if (Array.isArray(deductions) && deductions.length > 0) {
      return [...deductions].sort(
        (a, b) =>
          new Date(b.attendanceDate ?? b.date).getTime() -
          new Date(a.attendanceDate ?? a.date).getTime()
      );
    }
    const flat: AdjustmentRecord[] = [];
    for (const pkg of memberPackages ?? []) {
      for (const rec of pkg.adjustmentHistory ?? []) {
        flat.push({
          ...rec,
          packageName: rec.packageName ?? pkg.name,
          pkgId: rec.pkgId ?? pkg._id,
        });
      }
    }
    return flat.sort(
      (a, b) =>
        new Date(b.attendanceDate ?? b.date).getTime() -
        new Date(a.attendanceDate ?? a.date).getTime()
    );
  }, [deductions, memberPackages]);

  const packageOptions = useMemo(() => {
    const names = new Set<string>();
    for (const pkg of memberPackages ?? []) {
      if (pkg.name) names.add(pkg.name);
    }
    for (const rec of allRecords) {
      if (rec.packageName) names.add(rec.packageName);
    }
    return Array.from(names);
  }, [memberPackages, allRecords]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      if (!matchesSourceFilter(rec, sourceFilter)) return false;
      if (pkgFilter !== "ALL" && rec.packageName !== pkgFilter) return false;
      if (!fromDate && !toDate) return true;
      const targetDateStr = rec.attendanceDate ?? rec.date;
      const d = new Date(targetDateStr).getTime();
      if (isNaN(d)) return false;
      const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
      const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Infinity;
      return d >= from && d <= to;
    });
  }, [allRecords, sourceFilter, pkgFilter, fromDate, toDate]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredRecords.length / DEDUCTIONS_PAGE_SIZE)
  );
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pagedRecords = useMemo(
    () =>
      filteredRecords.slice(
        safePageIndex * DEDUCTIONS_PAGE_SIZE,
        (safePageIndex + 1) * DEDUCTIONS_PAGE_SIZE
      ),
    [filteredRecords, safePageIndex]
  );

  const hasFilter =
    sourceFilter !== "ALL" ||
    pkgFilter !== "ALL" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  return (
    <Card
      className={
        hideHeader
          ? "flex-1 border-0 shadow-none"
          : "flex-1 border border-border/40 shadow-sm"
      }
    >
      {!hideHeader && (
        <CardHeader>
          <h3 className="text-base font-semibold">Deductions & Adjustments</h3>
        </CardHeader>
      )}
      <CardContent className="p-3 sm:p-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-1 mr-1">
            {(
              [
                { value: "ALL", label: "All" },
                { value: "ATTENDANCE", label: "Attendance" },
                { value: "BOOKING", label: "Bookings" },
                { value: "MANUAL", label: "Admin / Coach" },
                { value: "CANCELLATION", label: "Cancellations" },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={sourceFilter === opt.value ? "default" : "outline"}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => {
                  setSourceFilter(opt.value);
                  setPageIndex(0);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {packageOptions.length > 1 && (
            <select
              value={pkgFilter}
              onChange={(e) => {
                setPkgFilter(e.target.value);
                setPageIndex(0);
              }}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All packages</option>
              {packageOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
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
                setPageIndex(0);
              }}
              className="h-7 text-xs w-36"
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
                setPageIndex(0);
              }}
              className="h-7 text-xs w-36"
            />
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => {
                setSourceFilter("ALL");
                setPkgFilter("ALL");
                setFromDate("");
                setToDate("");
                setPageIndex(0);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden">
          {pagedRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {hasFilter
                  ? "No deduction records match the selected filters"
                  : "No deductions found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pagedRecords.map((rec, index) => {
                const displayDate = rec.attendanceDate ?? rec.date;
                return (
                  <Card
                    key={index}
                    className="w-full hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <PackageIcon className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-semibold text-sm truncate">
                            {rec.packageName ?? rec.className ?? "Package"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              SOURCE_COLORS[rec.source] ??
                                "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            )}
                          >
                            {SOURCE_LABELS[rec.source] ?? rec.source}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              rec.type === "ADD"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            )}
                          >
                            {rec.type === "ADD" ? `+${rec.amount}` : `-${rec.amount}`}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-foreground">
                        {rec.reason ?? rec.className ?? "—"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {displayDate
                            ? format(new Date(displayDate), "dd MMM yyyy, hh:mm a")
                            : "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/30">
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Package
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Source
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Reason / Session
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-20 text-center text-muted-foreground text-sm"
                  >
                    {hasFilter
                      ? "No deduction records match the selected filters"
                      : "No deductions found"}
                  </TableCell>
                </TableRow>
              ) : (
                pagedRecords.map((rec, index) => {
                  const displayDate = rec.attendanceDate ?? rec.date;
                  return (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                        {displayDate
                          ? format(new Date(displayDate), "dd MMM yyyy, hh:mm a")
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-sm font-medium">
                        {rec.packageName ?? "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            rec.type === "ADD"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}
                        >
                          {rec.type === "ADD" ? "+Add" : "-Deduct"}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            SOURCE_COLORS[rec.source] ??
                              "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          )}
                        >
                          {SOURCE_LABELS[rec.source] ?? rec.source}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs font-medium text-right">
                        {rec.amount}
                      </TableCell>
                      <TableCell
                        className="py-2.5 px-3 text-xs text-muted-foreground max-w-[320px] truncate"
                        title={rec.reason ?? rec.className ?? ""}
                      >
                        {rec.reason ?? rec.className ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          pageIndex={safePageIndex}
          pageCount={pageCount}
          total={filteredRecords.length}
          pageSize={DEDUCTIONS_PAGE_SIZE}
          onPageChange={setPageIndex}
        />
      </CardContent>
    </Card>
  );
}
