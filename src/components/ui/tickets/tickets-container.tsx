"use client";

import { useCallback, useEffect, useState } from "react";
import { getTickets, Ticket } from "@/lib/data/tickets";
import { TicketColumnsWrapper } from "./columns";
import { DataTable } from "./data-table";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Input } from "../input";
import { Badge } from "../badge";
import { Search, RefreshCw, Ticket as TicketIcon } from "lucide-react";
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

export default function TicketsContainer() {
  const [data, setData] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getTickets(status, debouncedSearch || null, page, PAGE_SIZE);
      setData(res.data);
      setTotal(res.total);
    } catch {
      setData([]);
      setTotal(0);
    }
    setIsLoading(false);
  }, [status, debouncedSearch, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to first page when the filter or search changes.
  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const { columns, modal } = TicketColumnsWrapper({ onChanged: fetchData });
  const maxPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TicketIcon className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>Support Tickets</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and resolve problems reported from the app
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="font-normal">
              Total: {total}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Status filter tabs */}
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

          {/* Search + refresh */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, email..."
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
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

          {/* Table */}
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading tickets...
              </div>
            ) : (
              <DataTable columns={columns} data={data} />
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {maxPages} · {total} total
            </p>
            <div className="flex gap-2">
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
        </CardContent>
      </Card>
      {modal}
    </>
  );
}
