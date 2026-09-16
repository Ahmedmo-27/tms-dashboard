"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getAccounts } from "@/lib/data/accounts";
import type { UserAccount, AccountRole } from "@/types/accounts";
import { CreateAccountDialog } from "./create-account-dialog";
import { EditAccountDialog } from "./edit-account-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  UserCog,
  Trash2,
  Users,
  Building2,
  Globe,
  Mail,
  Dumbbell,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 20;

const ROLE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon?: React.ComponentType<{ className?: string }> }
> = {
  management: {
    label: "Management",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  admin: {
    label: "Admin",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  branch_admin: {
    label: "Branch Admin",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  coach: {
    label: "Coach",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  managing_coach: {
    label: "Managing Coach",
    badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  },
  mailer: {
    label: "Mailer",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  member: {
    label: "Member",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  user: {
    label: "User (App)",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

const ROLE_TABS = [
  { key: "all", label: "All Roles" },
  { key: "management", label: "Management" },
  { key: "branch_admin", label: "Branch Admins" },
  { key: "coach", label: "Coaches" },
  { key: "managing_coach", label: "Managing Coaches" },
  { key: "mailer", label: "Mailers" },
  { key: "member", label: "Members" },
  { key: "user", label: "App Users" },
];

export function AccountsContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");
  const [selectedRole, setSelectedRole] = useState(() => searchParams.get("role") ?? "all");
  const [selectedLocation, setSelectedLocation] = useState(
    () => searchParams.get("locationId") ?? "all"
  );
  const page = Number(searchParams.get("page")) || 1;

  const debouncedSearch = useDebounce(searchTerm, 400);
  const { locations } = useLocations(true);

  // Dialog state
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<UserAccount | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAccounts({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: selectedRole !== "all" ? selectedRole : undefined,
        locationId: selectedLocation !== "all" ? selectedLocation : undefined,
      });

      setAccounts(res.users || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Failed to load accounts:", error);
      setAccounts([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, debouncedSearch, selectedRole, selectedLocation]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedRole !== "all") params.set("role", selectedRole);
    if (selectedLocation !== "all") params.set("locationId", selectedLocation);
    if (page > 1) params.set("page", page.toString());

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedSearch, selectedRole, selectedLocation, page, router, pathname]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAccounts();
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (newPage + 1).toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Accounts Management</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {total} {total === 1 ? "account" : "accounts"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create, inspect, and manage system roles, branch assignments, and user credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Refresh accounts list"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <CreateAccountDialog onAccountCreated={fetchAccounts} />
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm scrollbar-thin">
        {ROLE_TABS.map((tab) => {
          const isActive = selectedRole === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedRole(tab.key);
                const params = new URLSearchParams(searchParams.toString());
                params.delete("page");
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-muted-foreground border-border hover:bg-muted/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Location Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-[220px]">
          <Select
            value={selectedLocation}
            onValueChange={(val) => {
              setSelectedLocation(val);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("page");
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Branch" />
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
      </div>

      {/* Accounts Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account User</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch / Scope</TableHead>
              <TableHead>Associated Details</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Users className="h-10 w-10 text-muted-foreground/40" />
                    <p className="font-medium text-foreground">No accounts found</p>
                    <p className="text-xs">
                      {searchTerm || selectedRole !== "all" || selectedLocation !== "all"
                        ? "Try clearing or broadening your search filters."
                        : "Click 'Add Account' to register a new user or staff member."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((acc) => {
                const roleConfig = ROLE_CONFIG[acc.role] || {
                  label: acc.role,
                  badgeClass: "bg-muted text-muted-foreground",
                };

                const branchName =
                  typeof acc.locationId === "object" && acc.locationId !== null
                    ? acc.locationId.branchName
                    : null;

                return (
                  <TableRow key={acc._id} className="hover:bg-muted/40">
                    {/* User info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="text-xs font-semibold bg-muted">
                            {getInitials(acc.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                            {acc.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{acc.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="font-mono text-xs text-foreground">
                      {acc.phoneNumber}
                    </TableCell>

                    {/* Role badge */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig.badgeClass}`}
                      >
                        {roleConfig.label}
                      </span>
                    </TableCell>

                    {/* Branch / Scope */}
                    <TableCell>
                      {branchName ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{branchName}</span>
                        </div>
                      ) : acc.role === "branch_admin" ? (
                        <span className="text-xs text-destructive font-medium flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Unassigned
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          <span>Global (All)</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Associated details */}
                    <TableCell className="text-xs text-muted-foreground">
                      {acc.role === "mailer" && acc.tmsEmail ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[160px]" title={acc.tmsEmail}>
                            {acc.tmsEmail}
                          </span>
                        </div>
                      ) : (acc.role === "coach" || acc.role === "managing_coach") && acc.coach ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                          <Dumbbell className="h-3.5 w-3.5 shrink-0" />
                          <span>Profile: {acc.coach.coachName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      {acc.createdAt ? format(new Date(acc.createdAt), "MMM d, yyyy") : "—"}
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingAccount(acc)}>
                            <UserCog className="mr-2 h-4 w-4 text-primary" />
                            <span>Edit Account & Role</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingAccount(acc)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Account</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <TablePagination
        pageIndex={page - 1}
        pageCount={pageCount}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      {/* Edit Dialog */}
      <EditAccountDialog
        account={editingAccount}
        open={Boolean(editingAccount)}
        onOpenChange={(isOpen) => !isOpen && setEditingAccount(null)}
        onAccountUpdated={fetchAccounts}
      />

      {/* Delete Dialog */}
      <DeleteAccountDialog
        account={deletingAccount}
        open={Boolean(deletingAccount)}
        onOpenChange={(isOpen) => !isOpen && setDeletingAccount(null)}
        onAccountDeleted={fetchAccounts}
      />
    </div>
  );
}

