"use client";

import { useCallback, useEffect, useState } from "react";
import { useCoachApi } from "@/hooks/useCoachApi";
import type { Ticket } from "@/lib/data/tickets";
import {
  getCoachTickets,
  getCoachTicketCategories,
  submitCoachTicket,
} from "@/lib/data/coach-tickets";
import { TicketColumnsWrapper } from "@/components/ui/tickets/columns";
import { DataTable } from "@/components/ui/tickets/data-table";
import { CreateTicketModal } from "@/components/ui/tickets/create-ticket-modal";
import { TicketDetailModal } from "@/components/ui/tickets/ticket-detail-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTable } from "@/components/ui/loading/skeleton-table";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 10;

export function CoachTicketsView() {
  const coachApi = useCoachApi();

  const [data, setData] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCoachTickets(
        coachApi,
        status,
        debouncedSearch || null,
        page,
        PAGE_SIZE
      );
      setData(res.data);
      setTotal(res.total);
    } catch {
      setData([]);
      setTotal(0);
    }
    setIsLoading(false);
  }, [coachApi, status, debouncedSearch, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const fetchCategories = useCallback(
    () => getCoachTicketCategories(coachApi),
    [coachApi]
  );

  const handleSubmit = useCallback(
    async (payload: {
      category: string;
      description: string;
      otherDetails?: string;
    }) => {
      await submitCoachTicket(coachApi, payload);
    },
    [coachApi]
  );

  const { columns, modal } = TicketColumnsWrapper({
    onChanged: fetchData,
    showBranch: false,
    canUpdateTicket: () => false,
  });

  const maxPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="w-full rounded-lg border bg-card text-card-foreground">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Your requests</h2>
            <p className="text-xs text-muted-foreground">
              File a request and track its status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal">
              Total: {total}
            </Badge>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={status === tab.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search your tickets…"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-[40px] pr-4 pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>

          <div className="md:hidden space-y-2">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                ))}
              </div>
            ) : data.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No tickets yet. Create one if you need help from the front desk.
              </p>
            ) : (
              data.map((ticket) => (
                <button
                  key={ticket._id}
                  type="button"
                  onClick={() => setDetailTicket(ticket)}
                  className="w-full rounded-lg border p-3 text-left hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{ticket.category}</p>
                    <Badge className={cn("font-normal", STATUS_CLASS[ticket.status])}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {ticket.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="hidden rounded-md border md:block">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable columns={4} rows={6} showSearch={false} showPagination={false} />
              </div>
            ) : (
              <DataTable columns={columns} data={data} />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              Page {page} of {maxPages} · {total} total
            </p>
            <div className="flex justify-center gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= maxPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      {modal}
      <TicketDetailModal
        ticket={detailTicket}
        open={!!detailTicket}
        onOpenChange={(open) => {
          if (!open) setDetailTicket(null);
        }}
        canUpdate={false}
      />
      <CreateTicketModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchData}
        fetchCategories={fetchCategories}
        onSubmit={handleSubmit}
      />
    </>
  );
}
