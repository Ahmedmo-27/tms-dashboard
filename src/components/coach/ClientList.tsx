"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, ChevronLeft, Loader2, X } from "lucide-react";
import type { RootState } from "@/lib/store/store";
import type { ClientDto } from "@/types/coach.types";
import { setCoachClients, setClientsLoading } from "@/lib/store/features/coachSlice";
import { useCoachApi } from "@/hooks/useCoachApi";
import { telHref } from "@/lib/utils/phone";
import toast from "react-hot-toast";

export function ClientList() {
  const dispatch = useAppDispatch();
  const coachApi = useCoachApi();
  const clients = useAppSelector((state: RootState) => state.coach.clients);
  const clientsLoading = useAppSelector((state: RootState) => state.coach.clientsLoading);
  const totalPages = useAppSelector((state: RootState) => state.coach.clientsTotalPages);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
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
        params.set("limit", "10");
        params.set("type", "PT");
        if (debouncedQuery) params.set("search", debouncedQuery);

        const res = await coachApi.get(`/api/coach/clients?${params.toString()}`);
        dispatch(
          setCoachClients({
            clients: res.data.data?.clients || [],
            totalPages: res.data.data?.totalPages || 1,
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
  }, [debouncedQuery, page, coachApi, dispatch, reloadKey]);

  const safeClients = Array.isArray(clients) ? clients : [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          className="pr-9 pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {clientsLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mb-4 h-8 w-8 animate-spin" />
          <p>Loading clients...</p>
        </div>
      ) : loadError ? (
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
          {debouncedQuery
            ? "No clients match your criteria."
            : "No clients assigned yet. Ask the front desk to assign PT clients."}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="divide-y overflow-hidden rounded-lg border">
            {safeClients.map((client: ClientDto) => {
              const tel = telHref(client.phoneNumber);
              const href = `/coach/clients/${client.memberId}?name=${encodeURIComponent(client.name)}&phone=${encodeURIComponent(client.phoneNumber)}`;
              return (
                <Link
                  key={client.memberId}
                  href={href}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{client.name}</p>
                      {client.source?.map((src) => (
                        <Badge key={src} variant="outline" className="text-[10px] font-normal">
                          {src}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {tel ? (
                        <span
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <a href={tel} className="hover:underline">
                            {client.phoneNumber}
                          </a>
                        </span>
                      ) : (
                        <span>{client.phoneNumber}</span>
                      )}
                      <span>· {client.activePackagesCount} active package{client.activePackagesCount === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
