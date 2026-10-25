"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSoldPackages } from "@/lib/data/sales";
import type { SoldPackage, SoldPackagesSummary } from "@/types/sales";
import { AssignSellerDialog } from "./assign-seller-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocations } from "@/lib/hooks/use-locations";
import { useSalesAccounts } from "@/lib/hooks/use-sales-accounts";
import { useAppSelector } from "@/lib/hooks";
import {
  canAssignSalesAttribution,
  canViewAllBranches,
} from "@/lib/config/roles";
import { HandCoins, RefreshCw, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 25;

const STATUS_CLASS: Record<string, string> = {
  ACTIVE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  FROZEN:
    "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  COMPLETED:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  EXPIRED:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

/** Legacy rows store the status in mixed case ("Active"), so normalise it. */
const statusKey = (status: string) => String(status ?? "").toUpperCase();

const EMPTY_SUMMARY: SoldPackagesSummary = {
  total: 0,
  assigned: 0,
  unassigned: 0,
  bySeller: [],
};

export function SalesAttributionContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role as string | undefined;
  const canAssign = canAssignSalesAttribution(role);
  const showBranchFilter = canViewAllBranches(role);

  const [rows, setRows] = useState<SoldPackage[]>([]);
  const [summary, setSummary] = useState<SoldPackagesSummary>(EMPTY_SUMMARY);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") ?? ""
  );
  const [seller, setSeller] = useState(() => searchParams.get("seller") ?? "all");
  const [selectedLocation, setSelectedLocation] = useState(
    () => searchParams.get("locationId") ?? "all"
  );
  const page = Number(searchParams.get("page")) || 1;

  const debouncedSearch = useDebounce(searchTerm, 400);
  const { locations } = useLocations(showBranchFilter);
  const { accounts, isLoading: accountsLoading } = useSalesAccounts();

  const [assigning, setAssigning] = useState<SoldPackage | null>(null);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSoldPackages({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        seller: seller !== "all" ? seller : undefined,
        locationId: selectedLocation !== "all" ? selectedLocation : undefined,
      });
      setRows(res.rows || []);
      setTotal(res.total || 0);
      setSummary(res.summary || EMPTY_SUMMARY);
    } catch (error) {
      console.error("Failed to load sold packages:", error);
      setRows([]);
      setTotal(0);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, debouncedSearch, seller, selectedLocation]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Keep the filters in the URL so a view can be shared or reloaded.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (seller !== "all") params.set("seller", seller);
    if (selectedLocation !== "all") params.set("locationId", selectedLocation);
    if (page > 1) params.set("page", page.toString());

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedSearch, seller, selectedLocation, page, router, pathname]);

  const resetPage = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (newPage + 1).toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Sales Attribution</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {total} {total === 1 ? "sold package" : "sold packages"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Set which sales account sold each package to which member.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setIsRefreshing(true);
            fetchRows();
          }}
          disabled={isLoading || isRefreshing}
          title="Refresh sold packages"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Sold packages</p>
          <p className="text-2xl font-semibold mt-1">{summary.total}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Credited to a salesperson</p>
          <p className="text-2xl font-semibold mt-1">{summary.assigned}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Not credited yet</p>
          <p className="text-2xl font-semibold mt-1">{summary.unassigned}</p>
        </div>
      </div>

      {summary.bySeller.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {summary.bySeller.map((entry) => (
            <button
              key={entry.salesAccountId}
              onClick={() => {
                setSeller(
                  seller === entry.salesAccountId ? "all" : entry.salesAccountId
                );
                resetPage();
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                seller === entry.salesAccountId
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground border-border hover:bg-muted/60"
              }`}
            >
              {entry.name} · {entry.count}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by member name, phone, or package..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-[220px]">
          <Select
            value={seller}
            onValueChange={(val) => {
              setSeller(val);
              resetPage();
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by salesperson" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sold packages</SelectItem>
              <SelectItem value="unassigned">Not credited yet</SelectItem>
              <SelectItem value="assigned">Credited</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account._id} value={account._id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showBranchFilter && locations.length > 1 && (
          <div className="w-full sm:w-[220px]">
            <Select
              value={selectedLocation}
              onValueChange={(val) => {
                setSelectedLocation(val);
                resetPage();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc._id} value={loc._id}>
                    {loc.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Sold packages */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sold By</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <HandCoins className="h-5 w-5" />
                    <p className="text-sm">No sold packages match these filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.memberPackageId}>
                  <TableCell>
                    <div className="font-medium">{row.memberName}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.memberPhone || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{row.packageName}</div>
                    {row.category && (
                      <div className="text-xs text-muted-foreground">
                        {row.category.replaceAll("_", " ")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.pkgStartDate
                      ? format(new Date(row.pkgStartDate), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>{row.branchName || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_CLASS[statusKey(row.status)] ?? ""}
                    >
                      {statusKey(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.soldBy ? (
                      <span className="font-medium">{row.soldBy.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Not credited</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canAssign && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssigning(row)}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        {row.soldBy ? "Change" : "Assign"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="px-3 pb-3">
          <TablePagination
            pageIndex={page - 1}
            pageCount={pageCount}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <AssignSellerDialog
        soldPackage={assigning}
        accounts={accounts}
        accountsLoading={accountsLoading}
        open={Boolean(assigning)}
        onOpenChange={(open) => {
          if (!open) setAssigning(null);
        }}
        onAssigned={fetchRows}
      />
    </div>
  );
}
