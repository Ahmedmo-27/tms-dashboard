"use client";

import { Member, columns } from "./columns";
import { DataTable } from "./data-table";
import { getMembers } from "@/lib/data/member";
import MembersPagination from "./members-pagination";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import Loading from "../loading/members-table";
import { Input } from "../input";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Search, RefreshCw, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../dropdown-menu";
import { Badge } from "../badge";
import { cn } from "@/lib/utils";
import NetworkErrorPage from "../error-pages/network-error";
import { NetworkError, NotFoundError, UnauthorizedError } from "@/core/api-error";
import NotFoundErrorPage from "../error-pages/not-found-error";
import UnauthorizedPage from "../error-pages/UnauthorizedPage";

export default function MembersContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const page = Number(searchParams.get("page")) || 1;
  const debouncedTerm = useDebounce(searchTerm, 500);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMembers(debouncedTerm || null, page, 10);
      const renderedMembers: Member[] = [];
      const members = response.data;
      for (const member in members) {
        renderedMembers.push({
          id: members[member].id,
          name: members[member].name,
          phone: members[member].phone,
          email: members[member].email,
          activePkgs: members[member].packages.length,
          packages: members[member].packages,
          bookings: members[member].bookings,
        });
      }
      setData(renderedMembers);
      setTotalMembers(response.total);
      setIsLoading(false);
    } catch (error) {
      if (error instanceof Error) setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData, page]);

  useEffect(() => {
    if (debouncedTerm !== searchParams.get("searchString")) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedTerm) {
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
    setError(null)
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  return error instanceof NetworkError ? (
    <NetworkErrorPage />
  ) : error instanceof UnauthorizedError ? (
    <UnauthorizedPage />
  ) : (
    <Card className="w-full">
      <CardHeader className="pb-0 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl">Members</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage and view all members
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-normal text-xs sm:text-sm w-fit">
            Total: {totalMembers}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 flex-1 lg:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 min-h-[40px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Active Members</DropdownMenuItem>
                <DropdownMenuItem>Expired Members</DropdownMenuItem>
                <DropdownMenuItem>Recent Activity</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-initial min-h-[40px]"
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 rounded-md border overflow-hidden">
          {isLoading ? (
            <Loading />
          ) : error instanceof NotFoundError ? (
            <NotFoundErrorPage fetchedItem="Member" />
          ) : (
            <div className="relative">
              <DataTable columns={columns} data={data} />
              {data.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
                  <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold">
                    No members found
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 sm:mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            Showing {data.length} of {totalMembers} members
          </p>
          <div className="order-1 sm:order-2">
            <MembersPagination
              currentPage={page}
              maxPages={Math.ceil(totalMembers / 10)}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
