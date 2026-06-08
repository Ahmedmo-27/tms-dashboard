"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight } from "lucide-react";
import { PackageDetail } from "@/components/coach/PackageDetail";
import type { RootState } from "@/lib/store/store";
import type { ClientDto } from "@/types/coach.types";
import { cn } from "@/lib/utils";

interface ClientListProps {
  /** When set to "deduct", automatically scrolls/highlights deduct action */
  initialView?: "deduct";
}

type FilterOption = "All" | "PT only" | "Group only" | "Both";

export function ClientList({ initialView }: ClientListProps) {
  const clients = useAppSelector((state: RootState) => state.coach.clients);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterOption>("All");
  const [selectedClient, setSelectedClient] = useState<ClientDto | null>(null);

  const safeClients = Array.isArray(clients) ? clients : [];

  const filtered = safeClients.filter((c: ClientDto) => {
    // Search
    const matchSearch =
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phoneNumber.includes(query);
    if (!matchSearch) return false;

    // Filter
    const hasPT = c.source.includes("PT");
    const hasGroup = c.source.includes("GROUP");

    if (filter === "All") return true;
    if (filter === "PT only") return hasPT && !hasGroup;
    if (filter === "Group only") return hasGroup && !hasPT;
    if (filter === "Both") return hasPT && hasGroup;

    return true;
  });

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
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {(["All", "PT only", "Group only", "Both"] as FilterOption[]).map(
          (opt) => (
            <Button
              key={opt}
              variant={filter === opt ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(opt)}
              className={cn(
                "rounded-full text-xs h-8",
                filter === opt && "pointer-events-none"
              )}
            >
              {opt}
            </Button>
          )
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {query || filter !== "All"
            ? "No clients match your criteria."
            : "No clients assigned yet."}
        </p>
      ) : (
        <div className="divide-y rounded-lg border overflow-hidden">
          {filtered.map((client: ClientDto) => (
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
                  <span>&bull;</span>
                  <span>
                    {client.activePackagesCount} active package
                    {client.activePackagesCount !== 1 ? "s" : ""}
                  </span>
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
      )}
    </div>
  );
}
