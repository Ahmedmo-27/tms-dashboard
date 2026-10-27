"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataColumn } from "@/components/finance/data-table";
import { downloadCsv, type CsvColumn } from "@/components/finance/csv";
import { formatDate } from "@/components/finance/format";
import { formatDisplayPhone, whatsAppHref } from "@/lib/utils/phone";
import type { ExpiringPackageItem } from "@/types/coach.types";
import {
  Clock,
  AlertTriangle,
  MessageSquare,
  Download,
  Search,
  X,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ExpiringCategoryFilter = "all" | "sessions" | "dates";

interface ExpiringPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: ExpiringPackageItem[];
  coachesList?: { id: string; name: string }[];
  initialFilter?: ExpiringCategoryFilter;
  initialCoachId?: string;
}

export function ExpiringPackagesModal({
  isOpen,
  onClose,
  packages,
  coachesList = [],
  initialFilter = "all",
  initialCoachId = "all",
}: ExpiringPackagesModalProps) {
  const [filterType, setFilterType] = useState<ExpiringCategoryFilter>(initialFilter);
  const [selectedCoachId, setSelectedCoachId] = useState<string>(initialCoachId);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setFilterType(initialFilter);
      setSelectedCoachId(initialCoachId);
      setSearchQuery("");
    }
  }, [isOpen, initialFilter, initialCoachId]);

  // Derived coaches list if not supplied or missing some
  const availableCoaches = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of coachesList) map.set(c.id, c.name);
    for (const p of packages) {
      if (p.coachId && p.coachName) {
        map.set(p.coachId, p.coachName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [coachesList, packages]);

  // Counts across all packages (or filtered by selected coach)
  const coachScopedPackages = useMemo(() => {
    if (!selectedCoachId || selectedCoachId === "all") return packages;
    return packages.filter((p) => p.coachId === selectedCoachId);
  }, [packages, selectedCoachId]);

  const counts = useMemo(() => {
    let sessionsCount = 0;
    let datesCount = 0;
    for (const p of coachScopedPackages) {
      if (p.isLowBalance) sessionsCount++;
      if (p.isExpiringSoon) datesCount++;
    }
    return {
      all: coachScopedPackages.length,
      sessions: sessionsCount,
      dates: datesCount,
    };
  }, [coachScopedPackages]);

  // Final filtered list based on category & search
  const filteredPackages = useMemo(() => {
    let list = coachScopedPackages;

    // Filter by category
    if (filterType === "sessions") {
      list = list.filter((p) => p.isLowBalance);
    } else if (filterType === "dates") {
      list = list.filter((p) => p.isExpiringSoon);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.memberName.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.coachName.toLowerCase().includes(q) ||
          p.packageName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [coachScopedPackages, filterType, searchQuery]);

  // CSV Export handler
  const handleExportCsv = () => {
    const columns: CsvColumn<ExpiringPackageItem>[] = [
      { header: "Client Name", value: (r) => r.memberName || "Client" },
      { header: "Phone", value: (r) => r.phone },
      { header: "Coach", value: (r) => r.coachName },
      { header: "Package", value: (r) => r.packageName },
      { header: "Remaining Sessions", value: (r) => r.remainingSessions },
      { header: "Expiry Date", value: (r) => r.pkgEndDate },
      { header: "Days Left", value: (r) => r.daysUntilExpiry },
      {
        header: "Expiring Reason",
        value: (r) =>
          r.isLowBalance && r.isExpiringSoon
            ? "Low Sessions & Expiring Date"
            : r.isLowBalance
              ? "Low Sessions (<= 2)"
              : "Expiring Soon (<= 7 days)",
      },
      { header: "Status", value: (r) => r.status },
    ];

    const coachNameTag =
      selectedCoachId !== "all"
        ? (availableCoaches.find((c) => c.id === selectedCoachId)?.name ?? "coach").replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
          )
        : "all-coaches";

    downloadCsv(`expiring-soon-packages-${coachNameTag}-${filterType}.csv`, filteredPackages, columns);
  };

  const columns: DataColumn<ExpiringPackageItem>[] = useMemo(
    () => [
      {
        key: "memberName",
        header: "Client",
        cell: (row) => (
          <div className="min-w-[140px]">
            <p className="font-semibold text-foreground text-sm leading-tight">
              {row.memberName && row.memberName !== "Unknown" ? row.memberName : "Client"}
            </p>
            {row.phone ? (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{formatDisplayPhone(row.phone)}</p>
            ) : (
              <span className="text-[10px] text-muted-foreground">No phone recorded</span>
            )}
          </div>
        ),
        sortValue: (r) => r.memberName,
      },
      {
        key: "coachName",
        header: "Coach",
        cell: (row) => (
          <Badge variant="outline" className="text-xs font-medium bg-muted/40 whitespace-nowrap">
            {row.coachName}
          </Badge>
        ),
        sortValue: (r) => r.coachName,
      },
      {
        key: "packageName",
        header: "Package",
        cell: (row) => (
          <div className="max-w-[240px]">
            <span className="text-xs font-medium text-foreground block truncate" title={row.packageName}>
              {row.packageName}
            </span>
          </div>
        ),
        sortValue: (r) => r.packageName,
      },
      {
        key: "remainingSessions",
        header: "Sessions Left",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1.5 min-w-[95px]">
            <span
              className={cn(
                "text-sm font-bold",
                row.isLowBalance
                  ? "text-amber-600 dark:text-amber-400 font-extrabold"
                  : "text-foreground"
              )}
            >
              {row.remainingSessions}
            </span>
            {row.isLowBalance && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
              >
                ≤ 2 left
              </Badge>
            )}
          </div>
        ),
        sortValue: (r) => r.remainingSessions,
        align: "right",
      },
      {
        key: "pkgEndDate",
        header: "Expiry Date",
        cell: (row) => (
          <div className="min-w-[115px]">
            <p className="text-xs font-medium">{formatDate(row.pkgEndDate)}</p>
            <p
              className={cn(
                "text-[11px] font-medium mt-0.5",
                row.isExpiringSoon
                  ? "text-orange-600 dark:text-orange-400 font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {row.daysUntilExpiry < 0
                ? "Expired"
                : row.daysUntilExpiry === 0
                  ? "Expires today"
                  : row.daysUntilExpiry === 1
                    ? "Expires tomorrow"
                    : `in ${row.daysUntilExpiry} days`}
            </p>
          </div>
        ),
        sortValue: (r) => r.daysUntilExpiry,
      },
      {
        key: "attention",
        header: "Expiring By",
        cell: (row) => (
          <div className="flex flex-wrap gap-1 min-w-[130px]">
            {row.isLowBalance && (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Low Sessions</span>
              </Badge>
            )}
            {row.isExpiringSoon && (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400 font-semibold"
              >
                <Clock className="h-3 w-3" />
                <span>Upcoming Date</span>
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "Action",
        cell: (row) => {
          const wa = whatsAppHref(row.phone);
          return (
            <div className="flex items-center justify-end gap-1.5 min-w-[100px]">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat on WhatsApp"
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
              {row.phone && (
                <a
                  href={`tel:${row.phone}`}
                  title="Call client"
                  className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          );
        },
        align: "right",
      },
    ],
    []
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl lg:max-w-6xl w-[96vw] max-h-[88vh] p-0 flex flex-col overflow-hidden sm:rounded-xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold">
                    Expiring Soon Packages
                  </DialogTitle>
                </div>
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Active client packages nearing expiration either by remaining sessions (≤ 2 left) or ending within 7 days.
            </DialogDescription>
          </div>

          {/* Controls Bar: Category Filter, Coach Select, Search, Export */}
          <div className="flex flex-col gap-2.5 pt-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Filter Pills */}
            <div className="inline-flex rounded-lg border bg-muted/40 p-1 text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors gap-1.5 inline-flex items-center",
                  filterType === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>All</span>
                <span className="text-[10px] font-bold opacity-75">({counts.all})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("sessions")}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors gap-1.5 inline-flex items-center",
                  filterType === "sessions"
                    ? "bg-background text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span>Sessions (≤ 2)</span>
                <span className="text-[10px] font-bold opacity-75">({counts.sessions})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("dates")}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors gap-1.5 inline-flex items-center",
                  filterType === "dates"
                    ? "bg-background text-orange-600 dark:text-orange-400 shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="h-3 w-3 text-orange-500" />
                <span>Dates (≤ 7d)</span>
                <span className="text-[10px] font-bold opacity-75">({counts.dates})</span>
              </button>
            </div>

            {/* Coach Selector, Search & Export */}
            <div className="flex flex-wrap items-center gap-2">
              {availableCoaches.length > 1 && (
                <div className="w-[145px] sm:w-[165px]">
                  <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Coaches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Coaches</SelectItem>
                      {availableCoaches.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="relative flex-1 min-w-[140px] sm:w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search client or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0"
                disabled={filteredPackages.length === 0}
                onClick={handleExportCsv}
                title="Export CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          {/* Mobile Card List View (< md) */}
          <div className="grid gap-2.5 md:hidden">
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg, idx) => {
                const wa = whatsAppHref(pkg.phone);
                return (
                  <Card key={`${pkg.memberId}-${pkg.packageId}-${idx}`} className="p-3.5 space-y-2.5 shadow-none border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{pkg.memberName && pkg.memberName !== "Unknown" ? pkg.memberName : "Client"}</p>
                        <p className="text-xs text-muted-foreground">{pkg.coachName} · {pkg.packageName}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Remaining Sessions</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              pkg.isLowBalance
                                ? "text-amber-600 dark:text-amber-400 font-extrabold"
                                : "text-foreground"
                            )}
                          >
                            {pkg.remainingSessions}
                          </span>
                          {pkg.isLowBalance && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 h-4 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                            >
                              ≤ 2 left
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground block">Expiry Date</span>
                        <p className="text-xs font-medium mt-0.5">{formatDate(pkg.pkgEndDate)}</p>
                        <p
                          className={cn(
                            "text-[10px] font-medium",
                            pkg.isExpiringSoon
                              ? "text-orange-600 dark:text-orange-400 font-semibold"
                              : "text-muted-foreground"
                          )}
                        >
                          {pkg.daysUntilExpiry < 0
                            ? "Expired"
                            : pkg.daysUntilExpiry === 0
                              ? "Expires today"
                              : `in ${pkg.daysUntilExpiry} days`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-1 border-t text-muted-foreground">
                      <span>Phone: <strong className="text-foreground">{formatDisplayPhone(pkg.phone) || "—"}</strong></span>
                      <div className="flex items-center gap-1">
                        {pkg.isLowBalance && (
                          <Badge variant="outline" className="text-[9px] border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            Low Sessions
                          </Badge>
                        )}
                        {pkg.isExpiringSoon && (
                          <Badge variant="outline" className="text-[9px] border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400">
                            Expiring Date
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No expiring packages match the selected criteria.
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              rows={filteredPackages}
              pageSize={10}
              emptyText="No expiring packages match the selected criteria."
              rowKey={(row, i) => `${row.memberId}-${row.packageId}-${i}`}
              initialSort={{ key: "daysUntilExpiry", dir: "asc" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5 sm:px-5 shrink-0">
          <div className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground font-semibold">{filteredPackages.length}</strong> of{" "}
            <strong className="text-foreground font-semibold">{packages.length}</strong> expiring packages
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs font-medium px-4">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
