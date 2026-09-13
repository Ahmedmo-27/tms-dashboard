"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FrozenPackagesContainer from "./frozen-packages-container";
import FreezeRequestsContainer from "@/components/ui/freeze-requests/freeze-requests-container";
import { AdminFreezeMemberDialog } from "@/components/ui/dialogs/freeze/admin-freeze-member-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Snowflake, Clock, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { getFrozenPackages, getFreezeRequests } from "@/lib/data/freeze";
import { useBranchContext } from "@/lib/hooks/use-branch-context";

export default function PackageFreezesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const activeTab = urlTab === "freeze-requests" ? "freeze-requests" : "frozen-packages";

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.push(`/dashboard/package-freezes?${params.toString()}`);
  };

  const [stats, setStats] = useState({
    frozenCount: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  });

  const { effectiveLocationId } = useBranchContext();

  const loadStats = useCallback(async () => {
    try {
      const [frozenData, pendingData, approvedData, rejectedData] = await Promise.all([
        getFrozenPackages("", 1, 1, effectiveLocationId || undefined),
        getFreezeRequests("PENDING", "", 1, 1, effectiveLocationId || undefined),
        getFreezeRequests("APPROVED", "", 1, 1, effectiveLocationId || undefined),
        getFreezeRequests("REJECTED", "", 1, 1, effectiveLocationId || undefined),
      ]);

      setStats({
        frozenCount: frozenData.total || 0,
        pendingRequests: pendingData.total || 0,
        approvedRequests: approvedData.total || 0,
        rejectedRequests: rejectedData.total || 0,
      });
    } catch (err) {
      console.error("Failed to load freeze overview stats", err);
    }
  }, [effectiveLocationId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="flex min-h-full flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Snowflake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Package Freeze Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor currently frozen packages, review extra freeze requests, and apply or lift freezes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" data-walkthrough="admin-freeze-btn">
          <AdminFreezeMemberDialog onSuccess={loadStats} />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" data-walkthrough="freeze-overview-stats">
        <Card className="border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Snowflake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Currently Frozen</p>
              <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{stats.frozenCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending Requests</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pendingRequests}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Approved Requests</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.approvedRequests}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Rejected Requests</p>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{stats.rejectedRequests}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-2" data-walkthrough="freeze-tabs-list">
          <TabsTrigger
            value="frozen-packages"
            className="gap-2"
            data-walkthrough="frozen-packages-tab-trigger"
          >
            <Snowflake className="h-4 w-4" />
            <span>Frozen Packages</span>
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
              {stats.frozenCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="freeze-requests"
            className="gap-2"
            data-walkthrough="freeze-requests-tab-trigger"
          >
            <Clock className="h-4 w-4" />
            <span>Extra Freeze Requests</span>
            {stats.pendingRequests > 0 && (
              <span className="ml-1 text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                {stats.pendingRequests}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frozen-packages" className="space-y-4">
          <FrozenPackagesContainer onRefreshStats={loadStats} />
        </TabsContent>

        <TabsContent value="freeze-requests" className="space-y-4">
          <FreezeRequestsContainer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
