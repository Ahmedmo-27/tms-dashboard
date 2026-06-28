"use client";

import { useCallback, useEffect, useState } from "react";
import { useCoachApi } from "@/hooks/useCoachApi";
import type { Ticket } from "@/lib/data/tickets";
import {
  getCoachTickets,
  getCoachTicketCategories,
  submitCoachTicket,
  updateCoachTicketStatus,
} from "@/lib/data/coach-tickets";
import { TicketColumnsWrapper } from "@/components/ui/tickets/columns";
import { DataTable } from "@/components/ui/tickets/data-table";
import { CreateTicketModal } from "@/components/ui/tickets/create-ticket-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Ticket as TicketIcon, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

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

  const updateStatus = useCallback(
    async (id: string, ticketStatus: Ticket["status"], adminNotes?: string) => {
      return updateCoachTicketStatus(coachApi, id, ticketStatus, adminNotes);
    },
    [coachApi]
  );

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
    showBranch: true,
    updateTicketStatusFn: updateStatus,
  });

  const maxPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <TicketIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate">Support Tickets</h2>
              <p className="text-xs text-muted-foreground truncate">
                View and manage all support tickets across branches
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal text-xs">
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
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, email, creator..."
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 min-h-[40px]"
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

          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading tickets...
              </div>
            ) : (
              <DataTable columns={columns} data={data} />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Page {page} of {maxPages} · {total} total
            </p>
            <div className="flex justify-center sm:justify-end gap-2">
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
