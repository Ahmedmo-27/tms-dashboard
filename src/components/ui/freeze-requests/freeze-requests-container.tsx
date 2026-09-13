"use client";

import { useEffect, useState, useCallback } from "react";
import { FreezeRequestItem, getFreezeRequests } from "@/lib/data/freeze";
import { FreezeRequestsTable } from "./freeze-requests-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RotateCcw, Loader2, Snowflake } from "lucide-react";
import { useBranchContext } from "@/lib/hooks/use-branch-context";

export default function FreezeRequestsContainer() {
  const [requests, setRequests] = useState<FreezeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { effectiveLocationId } = useBranchContext();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFreezeRequests(
        statusFilter,
        search,
        page,
        15,
        effectiveLocationId || undefined
      );
      setRequests(data.requests);
      setTotal(data.total);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load freeze requests", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, effectiveLocationId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-sky-500" />
          <h2 className="text-lg font-semibold tracking-tight">
            Extra Freeze Requests ({total})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search member or phone..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9 h-9"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRequests()}
            disabled={loading}
            className="h-9 px-2.5"
            title="Refresh"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between" data-walkthrough="freeze-status-filter">
        <Tabs value={statusFilter} onValueChange={handleStatusChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="APPROVED">Approved</TabsTrigger>
            <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            <TabsTrigger value="ALL">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm">Loading freeze requests...</p>
        </div>
      ) : (
        <>
          <div data-walkthrough="freeze-requests-table">
            <FreezeRequestsTable requests={requests} onRefresh={fetchRequests} />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
