"use client";

import { User, columns } from "./columns";
import { DataTable } from "./data-table";
import { getUsers, getAllPendingMembers } from "@/lib/data/users";
import MembersPagination from "./members-pagination";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import Loading from "../loading/members-table";
import { Input } from "../input";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { NotFoundError } from "@/core/api-error";
import { Search, RefreshCw, Users, Download } from "lucide-react";
import { Badge } from "../badge";
import { cn } from "@/lib/utils";

export default function PendingMembersContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const page = Number(searchParams.get("page")) || 1;
  const debouncedTerm = useDebounce(searchTerm, 500);
  const searchParamsRef = useRef(searchParams);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUsers(debouncedTerm || null, page, 10);
      const users = response.data;
      const renderedUsers: User[] = users.map((user: any) => ({
        id: user._id,
        name: user.name,
        phone: user.phoneNumber,
        email: user.email,
        pendingPackages: user.pendingPackages ?? [],
      }));
      setData(renderedUsers);
      setTotalUsers(response.total);
    } catch (error) {
      if (error instanceof NotFoundError) {
        setData([]);
        setTotalUsers(0);
      }
    }
    setIsLoading(false);
  }, [page, debouncedTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData, page]);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    if (debouncedTerm) {
      params.set("searchString", debouncedTerm);
    } else {
      params.delete("searchString");
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedTerm, router, pathname]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      if (debouncedTerm) params.set("searchString", debouncedTerm);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, debouncedTerm]
  );

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const users = await getAllPendingMembers();
      const headers = ["Name", "Phone", "Email", "Request Date"];
      const rows = users.map((u) => [
        u.name,
        u.phoneNumber,
        u.email,
        new Date(u.createdAt).toLocaleString(),
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `pending-member-requests-${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

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
                  <h2 className="text-lg font-semibold">Pending Requests</h2>
                  <p className="text-sm text-muted-foreground">
                    Review and approve member requests
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="font-normal text-xs">
                {totalUsers}
              </Badge>
            </div>
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
            <div className="flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
                disabled={isDownloading || totalUsers === 0}
                className="flex-1 max-w-40"
              >
                <Download
                  className={cn("mr-2 h-4 w-4", isDownloading && "animate-spin")}
                />
                Download Report
              </Button>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="mt-4">
            {isLoading ? (
              <Loading />
            ) : (
              <div className="relative">
                <DataTable columns={columns} data={data} />
                {data.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No member requests found
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try adjusting your search
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Pagination */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {data.length} of {totalUsers} requests
            </p>
            <MembersPagination
              currentPage={page}
              maxPages={Math.ceil(totalUsers / 10)}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Desktop: Card wrapper */}
      <Card className="hidden md:block w-full">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>Pending Member Requests</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage and view all pending member requests
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="font-normal">
              Total: {totalUsers}
            </Badge>
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
                disabled={isDownloading || totalUsers === 0}
              >
                <Download
                  className={cn("mr-2 h-4 w-4", isDownloading && "animate-spin")}
                />
                Download Report
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-md border">
            {isLoading ? (
              <Loading />
            ) : (
              <div className="relative">
                <DataTable columns={columns} data={data} />
                {data.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No member requests found
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {data.length} of {totalUsers} requests
            </p>
            <MembersPagination
              currentPage={page}
              maxPages={Math.ceil(totalUsers / 10)}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
