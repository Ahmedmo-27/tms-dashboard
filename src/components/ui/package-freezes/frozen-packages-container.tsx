"use client";

import { useEffect, useState, useCallback } from "react";
import { FrozenPackageItem, getFrozenPackages } from "@/lib/data/freeze";
import { FrozenPackagesTable } from "./frozen-packages-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Loader2, Snowflake } from "lucide-react";
import { useBranchContext } from "@/lib/hooks/use-branch-context";

export default function FrozenPackagesContainer({
  onRefreshStats,
}: {
  onRefreshStats?: () => void;
}) {
  const [packages, setPackages] = useState<FrozenPackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { effectiveLocationId } = useBranchContext();

  const fetchFrozenPackages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFrozenPackages(
        search,
        page,
        15,
        effectiveLocationId || undefined
      );
      setPackages(data.packages);
      setTotal(data.total);
      setTotalPages(data.totalPages || 1);
      onRefreshStats?.();
    } catch (err) {
      console.error("Failed to load frozen packages", err);
    } finally {
      setLoading(false);
    }
  }, [search, page, effectiveLocationId, onRefreshStats]);

  useEffect(() => {
    fetchFrozenPackages();
  }, [fetchFrozenPackages]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-sky-500" />
          <h2 className="text-lg font-semibold tracking-tight">
            Currently Frozen Packages ({total})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72" data-walkthrough="frozen-packages-search">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search member name or phone..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9 h-9"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFrozenPackages()}
            disabled={loading}
            className="h-9 px-2.5"
            title="Refresh"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-card">
          <Loader2 className="h-8 w-8 animate-spin mb-2 text-sky-500" />
          <p className="text-sm">Loading frozen packages...</p>
        </div>
      ) : (
        <>
          <div data-walkthrough="frozen-packages-table">
            <FrozenPackagesTable
              packages={packages}
              onRefresh={fetchFrozenPackages}
            />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages} ({total} frozen packages)
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
