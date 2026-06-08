"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { PackageDetail } from "@/components/coach/PackageDetail";
import type { RootState } from "@/lib/store/store";
import type { ClientDto } from "@/types/coach.types";
import { setCoachClients, setClientsLoading } from "@/lib/store/features/coachSlice";
import { useCoachApi } from "@/hooks/useCoachApi";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ClientListProps {
  /** When set to "deduct", automatically scrolls/highlights deduct action */
  initialView?: "deduct";
}



export function ClientList({ initialView }: ClientListProps) {
  const dispatch = useAppDispatch();
  const coachApi = useCoachApi();
  const clients = useAppSelector((state: RootState) => state.coach.clients);
  const clientsLoading = useAppSelector((state: RootState) => state.coach.clientsLoading);
  const totalPages = useAppSelector((state: RootState) => state.coach.clientsTotalPages);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<ClientDto | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);



  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      dispatch(setClientsLoading(true));
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "10");
        if (debouncedQuery) params.set("search", debouncedQuery);

        const res = await coachApi.get(`/api/coach/clients?${params.toString()}`);
        dispatch(
          setCoachClients({
            clients: res.data.data?.clients || [],
            totalPages: res.data.data?.totalPages || 1,
          })
        );
      } catch {
        toast.error("Failed to load clients.");
      } finally {
        dispatch(setClientsLoading(false));
      }
    };
    fetchClients();
  }, [debouncedQuery, page, coachApi, dispatch]);

  const safeClients = Array.isArray(clients) ? clients : [];

  if (selectedClient) {
    return (
      <PackageDetail
        // @ts-ignore PackageDetail might still use CoachClient, but they are aliased
        client={selectedClient}
        openDeductOnMount={initialView === "deduct"}
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return (
    <div className="space-y-4">

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {clientsLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading clients...</p>
        </div>
      ) : safeClients.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {debouncedQuery
            ? "No clients match your criteria."
            : "No clients assigned yet."}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="divide-y rounded-lg border overflow-hidden">
            {safeClients.map((client: ClientDto) => (
              <div
                key={client.memberId}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{client.name}</p>
                    <div className="flex gap-1 shrink-0">
                      {client.source.includes("PT") && (
                        <Badge className="bg-purple-500 hover:bg-purple-600 border-none text-[10px] px-1.5 py-0">
                          PT
                        </Badge>
                      )}
                      {client.source.includes("GROUP") && (
                        <Badge className="bg-teal-500 hover:bg-teal-600 border-none text-[10px] px-1.5 py-0">
                          Group
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{client.phoneNumber}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => setSelectedClient(client)}
                  >
                    View packages
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
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
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
