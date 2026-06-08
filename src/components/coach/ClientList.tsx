"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight } from "lucide-react";
import { PackageDetail } from "@/components/coach/PackageDetail";
import type { CoachClient } from "@/lib/store/features/coachSlice";
import type { RootState } from "@/lib/store/store";

interface ClientListProps {
  /** When set to "deduct", automatically scrolls/highlights deduct action */
  initialView?: "deduct";
}

export function ClientList({ initialView }: ClientListProps) {
  const clients = useAppSelector((state: RootState) => state.coach.clients);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<CoachClient | null>(null);

  const filtered = (clients as CoachClient[]).filter(
    (c: CoachClient) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
  );

  if (selectedClient) {
    return (
      <PackageDetail
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

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {query ? "No clients match your search." : "No clients assigned yet."}
        </p>
      ) : (
        <div className="divide-y rounded-lg border overflow-hidden">
          {filtered.map((client: CoachClient) => (
            <div
              key={client.memberId}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.phone}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {client.activePackagesCount} active pkg
                  {client.activePackagesCount !== 1 ? "s" : ""}
                </Badge>
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
