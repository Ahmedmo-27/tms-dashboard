"use client";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import Loading from "../loading/members-table";
import { Input } from "../input";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { NotFoundError } from "@/core/api-error";
import { Search, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNonUserPackages } from "@/lib/data/non-user-packages";

export default function NewPackagesContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const page = Number(searchParams.get("page")) || 1;
  const debouncedTerm = useDebounce(searchTerm, 500);

  const fetchData = useCallback(async () => {
    if (!debouncedTerm) {
      setData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await getNonUserPackages(debouncedTerm, page, 10); // Get Packages
      const pkgs = response.data;
      const renderedPkgs: any[] = [];
      for (const pkg of pkgs) {
        renderedPkgs.push({
          name: (pkg as any).name,
          phone: (pkg as any).phoneNumber,
          pkgName: (pkg as any).pkgId.name,
          remainingClasses: (pkg as any).remainingClasses,
        });
      }
      setData(renderedPkgs);
      console.log(renderedPkgs)
    } catch (error) {
      if (error instanceof NotFoundError) {
        setData([]);
      }
    }
    setIsLoading(false);
  }, [page, debouncedTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData, page]);

  useEffect(() => {
    if (debouncedTerm !== searchParams.get("searchString")) {
      const params = new URLSearchParams(searchParams.toString());
      if (!debouncedTerm) {
        params.set("searchString", debouncedTerm);
      } else {
        params.delete("searchString");
      }
      if (!params.has("page")) {
        params.set("page", "1");
      }

      router.push(`${pathname}?${params.toString()}`);
    }
  }, [debouncedTerm, router, pathname, searchParams]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      if (debouncedTerm) params.set("searchString", debouncedTerm);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, debouncedTerm]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  return (
    <>
      {/* Mobile: No card wrapper for better spacing */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {/* Mobile Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold">New Packages</h2>
                  <p className="text-sm text-muted-foreground">
                    Review newly added packages
                  </p>
                </div>
              </div>
              {/* <Badge variant="secondary" className="font-normal text-xs">
                {totalUsers}
              </Badge> */}
            </div>
          </div>{" "}
        </div>

        {/* Mobile Search and Controls */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 max-w-32"
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="mt-4">
          {isLoading ? (
            <Loading />
          ) : !debouncedTerm ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Search to see results</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter a name or phone number to find packages
              </p>
            </div>
          ) : (
            <div className="relative">
              <DataTable columns={columns} data={data} />
              {data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No packages found
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Card wrapper */}
      <Card className="hidden md:block w-full">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>New Packages</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage and view all new packages added
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
                />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-md border">
            {isLoading ? (
              <Loading />
            ) : !debouncedTerm ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Search to see results</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter a name or phone number to find packages
                </p>
              </div>
            ) : (
              <div className="relative">
                <DataTable columns={columns} data={data} />
                {data.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No packages found
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
