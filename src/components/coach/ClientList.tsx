"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  Phone,
} from "lucide-react";
import type { RootState } from "@/lib/store/store";
import type { ClientDto } from "@/types/coach.types";
import { setCoachClients, setClientsLoading } from "@/lib/store/features/coachSlice";
import { useCoachApi } from "@/hooks/useCoachApi";
import { telHref } from "@/lib/utils/phone";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

type StatusFilter = "active" | "past" | "all";
type AlertFilter = "low" | "expiring" | null;

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      className="h-7 rounded-full px-3 text-xs"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function expiryLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "dd MMM");
}

function rowMeta(client: ClientDto): string {
  const parts: string[] = [];
  if (client.remainingClasses !== null) {
    parts.push(`${client.remainingClasses} left`);
  } else {
    parts.push("No active PT");
  }

  const expires = expiryLabel(client.nearestExpiryDate);
  if (expires) parts.push(`expires ${expires}`);

  parts.push(
    `${client.activePackagesCount} active package${client.activePackagesCount === 1 ? "" : "s"}`
  );
  return parts.join(" · ");
}

function emptyCopy(
  debouncedQuery: string,
  status: StatusFilter,
  alert: AlertFilter,
  hasPtSessions: boolean,
): string {
  if (debouncedQuery) return "No clients match your criteria.";
  if (status === "past") return "No past PT clients.";
  if (alert) return "No clients match these filters.";
  if (hasPtSessions) {
    return "No clients assigned yet. Ask the front desk to assign PT clients.";
  }
  return "No clients assigned yet.";
}

export function ClientList() {
  const dispatch = useAppDispatch();
  const coachApi = useCoachApi();
  const clients = useAppSelector((state: RootState) => state.coach.clients);
  const clientsLoading = useAppSelector((state: RootState) => state.coach.clientsLoading);
  const totalPages = useAppSelector((state: RootState) => state.coach.clientsTotalPages);
  const clientsTotal = useAppSelector((state: RootState) => state.coach.clientsTotal);
  const hasPtSessions = useAppSelector((state: RootState) => state.coach.hasPtSessions);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [alert, setAlert] = useState<AlertFilter>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchClients = async () => {
      dispatch(setClientsLoading(true));
      setLoadError(false);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", String(PAGE_SIZE));
        params.set("status", status);
        params.set("type", "PT");
        if (alert) params.set("alert", alert);
        if (debouncedQuery) params.set("search", debouncedQuery);

        const res = await coachApi.get(`/api/coach/clients?${params.toString()}`);
        dispatch(
          setCoachClients({
            clients: res.data.data?.clients || [],
            totalPages: res.data.data?.totalPages || 1,
            total: res.data.data?.total ?? 0,
          })
        );
      } catch {
        setLoadError(true);
        toast.error("Failed to load clients.");
      } finally {
        dispatch(setClientsLoading(false));
      }
    };
    fetchClients();
  }, [
    debouncedQuery,
    page,
    status,
    alert,
    coachApi,
    dispatch,
    reloadKey,
  ]);

  const safeClients = Array.isArray(clients) ? clients : [];
  const isInitialLoad = clientsLoading && safeClients.length === 0 && !loadError;
  const isRefreshing = clientsLoading && safeClients.length > 0;

  const setStatusFilter = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const toggleAlert = (next: Exclude<AlertFilter, null>) => {
    setAlert((current) => (current === next ? null : next));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Your PT clients
          {!isInitialLoad && !loadError ? ` · ${clientsTotal} client${clientsTotal === 1 ? "" : "s"}` : ""}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          className="pr-9 pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search clients"
        />
        {isRefreshing ? (
          <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip label="Active" selected={status === "active"} onClick={() => setStatusFilter("active")} />
        <Chip label="Past" selected={status === "past"} onClick={() => setStatusFilter("past")} />
        <Chip label="All" selected={status === "all"} onClick={() => setStatusFilter("all")} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip
          label="Low remaining"
          selected={alert === "low"}
          onClick={() => toggleAlert("low")}
        />
        <Chip
          label="Expiring soon"
          selected={alert === "expiring"}
          onClick={() => toggleAlert("expiring")}
        />
      </div>

      {isInitialLoad ? (
        <div className="divide-y overflow-hidden rounded-lg border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : loadError && safeClients.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load clients.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Try again
          </Button>
        </div>
      ) : safeClients.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {emptyCopy(debouncedQuery, status, alert, hasPtSessions)}
        </p>
      ) : (
        <div className={cn("space-y-4", isRefreshing && "opacity-60")}>
          <div className="divide-y overflow-hidden rounded-lg border">
            {safeClients.map((client: ClientDto) => {
              const tel = telHref(client.phoneNumber);
              const low = client.remainingClasses !== null && client.remainingClasses <= 2;
              const expiring = client.daysUntilExpiry !== null && client.daysUntilExpiry <= 14;
              return (
                <div key={client.memberId} className="flex items-stretch">
                  <Link
                    href={`/coach/clients/${client.memberId}`}
                    className="flex min-w-0 flex-1 items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="mb-1 truncate text-sm font-medium">{client.name}</p>
                      <p
                        className={cn(
                          "truncate text-xs text-muted-foreground",
                          (low || expiring) && "text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {rowMeta(client)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                  {tel && (
                    <a
                      href={tel}
                      aria-label={`Call ${client.name}`}
                      className="flex items-center border-l px-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              {clientsTotal} client{clientsTotal === 1 ? "" : "s"}
              {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
            </p>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || clientsLoading}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || clientsLoading}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
