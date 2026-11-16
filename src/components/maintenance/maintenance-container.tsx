"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Building2,
  History,
  LayoutDashboard,
  RefreshCw,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/lib/hooks";
import { toPermissionRole } from "@/lib/config/roles";
import {
  CurrentSlotData,
  ManagementOverviewData,
  MaintenanceHistoryData,
  MaintenanceItemId,
  getCurrentMaintenanceSlot,
  updateMaintenanceItem,
  batchUpdateMaintenance,
  getManagementMaintenanceOverview,
  getMaintenanceHistory,
} from "@/lib/data/maintenance";
import { CountdownTimer } from "./countdown-timer";
import { BranchChecklistCard } from "./branch-checklist-card";
import { ManagementOverviewGrid } from "./management-overview-grid";
import { HourlyProgressTimeline } from "./hourly-progress-timeline";
import { MaintenanceHistoryTable } from "./maintenance-history-table";
import toast from "react-hot-toast";

export function MaintenanceContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryLocationId = searchParams.get("locationId");

  const user = useAppSelector((state) => state.auth.user);
  const permissionRole = toPermissionRole(user?.role as string | undefined);
  const isManagement = permissionRole === "management";
  const userLocationId = (user as any)?.locationId?.toString() || null;

  // Active location: for branch_admin it's userLocationId; for management it's queryLocationId or null
  const effectiveLocationId = isManagement ? queryLocationId : userLocationId;

  // State
  const [activeTab, setActiveTab] = useState<string>(
    isManagement && !queryLocationId ? "overview" : "checklist"
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentSlot, setCurrentSlot] = useState<CurrentSlotData | null>(null);
  const [overviewData, setOverviewData] =
    useState<ManagementOverviewData | null>(null);
  const [historyData, setHistoryData] =
    useState<MaintenanceHistoryData | null>(null);

  // Selected date for history (defaults to today)
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTimelineHour, setSelectedTimelineHour] = useState<number | null>(
    null
  );

  // Data fetching
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);

      const promises: Promise<any>[] = [
        getCurrentMaintenanceSlot(effectiveLocationId).catch((e) => {
          console.warn("Failed to load current slot", e);
          return null;
        }),
        getMaintenanceHistory({
          locationId: effectiveLocationId,
          date: selectedDate,
        }).catch((e) => {
          console.warn("Failed to load history", e);
          return null;
        }),
      ];

      if (isManagement) {
        promises.push(
          getManagementMaintenanceOverview().catch((e) => {
            console.warn("Failed to load overview", e);
            return null;
          })
        );
      }

      const [slotRes, historyRes, mgtRes] = await Promise.all(promises);

      if (slotRes) setCurrentSlot(slotRes);
      if (historyRes) setHistoryData(historyRes);
      if (mgtRes) setOverviewData(mgtRes);
    } catch {
      toast.error("Failed to load maintenance checklist data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveLocationId, isManagement, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle hourly rollover (auto-reset view when countdown reaches 0)
  const handleHourReset = useCallback(() => {
    toast.success("New hour started! Checklist reset for the new inspection window.", {
      icon: "⏰",
      duration: 6000,
    });
    loadData();
  }, [loadData]);

  // Handle single item check
  const handleToggleItem = async (
    itemId: MaintenanceItemId,
    newStatus: boolean,
    notes?: string
  ) => {
    if (!currentSlot) return;
    await updateMaintenanceItem({
      locationId: effectiveLocationId,
      itemId,
      isCompleted: newStatus,
      notes,
    });
    await loadData();
  };

  // Handle mark all complete
  const handleMarkAllComplete = async () => {
    if (!currentSlot) return;
    try {
      setIsSubmitting(true);
      await batchUpdateMaintenance({
        locationId: effectiveLocationId,
        items: [
          { id: "showers_bottles", isCompleted: true },
          { id: "towels", isCompleted: true },
          { id: "communal_area", isCompleted: true },
          { id: "gym_prepared", isCompleted: true },
        ],
        notes: "All 4 checklist areas inspected and verified.",
      });
      toast.success("All space areas marked completed for this hour! 🎉");
      await loadData();
    } catch {
      toast.error("Failed to mark checklist as complete");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Select branch from overview
  const handleSelectBranchFromOverview = (branchId: string) => {
    router.push(`/dashboard/maintenance?locationId=${branchId}`);
    setActiveTab("checklist");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Loading Space Maintenance Checklist...
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Space Maintenance Checklist
              </h1>
              {currentSlot?.location?.branchName && (
                <Badge variant="outline" className="font-medium">
                  {currentSlot.location.branchName}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Hourly space inspection &amp; maintenance tracking (resets every
              hour at :00)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Role-Specific View */}
      {isManagement ? (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              <span>All Branches</span>
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5">
              <ClipboardCheck className="h-4 w-4" />
              <span>Branch Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-4 w-4" />
              <span>Audit History</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Real-time Multi-Branch Overview */}
          <TabsContent value="overview" className="space-y-6">
            {overviewData ? (
              <ManagementOverviewGrid
                overviewData={overviewData}
                onSelectBranch={handleSelectBranchFromOverview}
              />
            ) : (
              <div className="rounded-xl border p-8 text-center text-muted-foreground">
                No branch overview data available.
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Branch Checklist */}
          <TabsContent value="checklist" className="space-y-6">
            {currentSlot ? (
              <div className="space-y-6">
                <CountdownTimer
                  initialSecondsRemaining={
                    currentSlot.secondsRemainingInHour
                  }
                  slotHour={currentSlot.slotHour}
                  onHourReset={handleHourReset}
                />

                <BranchChecklistCard
                  slotData={currentSlot}
                  onToggleItem={handleToggleItem}
                  onMarkAllComplete={handleMarkAllComplete}
                  isSubmitting={isSubmitting}
                />

                {historyData && (
                  <HourlyProgressTimeline
                    timelineHours={historyData.timelineHours}
                    logs={historyData.logs}
                    currentCairoHour={historyData.currentCairoHour}
                    isToday={historyData.isToday}
                    selectedHour={selectedTimelineHour}
                    onSelectHour={(h) => setSelectedTimelineHour(h)}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl border p-8 text-center text-muted-foreground">
                Please select a branch using the branch selector above to inspect
                its hourly checklist.
              </div>
            )}
          </TabsContent>

          {/* TAB 3: Audit Log & History */}
          <TabsContent value="history" className="space-y-6">
            {historyData && (
              <>
                <HourlyProgressTimeline
                  timelineHours={historyData.timelineHours}
                  logs={historyData.logs}
                  currentCairoHour={historyData.currentCairoHour}
                  isToday={historyData.isToday}
                  selectedHour={selectedTimelineHour}
                  onSelectHour={(h) => setSelectedTimelineHour(h)}
                />

                <MaintenanceHistoryTable
                  logs={historyData.logs}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  showBranchColumn={!effectiveLocationId}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Branch Admin View */
        <div className="space-y-6">
          {currentSlot ? (
            <>
              {/* Countdown & Reset Banner */}
              <CountdownTimer
                initialSecondsRemaining={currentSlot.secondsRemainingInHour}
                slotHour={currentSlot.slotHour}
                onHourReset={handleHourReset}
              />

              {/* Interactive 4-Item Checklist Card */}
              <BranchChecklistCard
                slotData={currentSlot}
                onToggleItem={handleToggleItem}
                onMarkAllComplete={handleMarkAllComplete}
                isSubmitting={isSubmitting}
              />

              {/* Today's Hourly Timeline */}
              {historyData && (
                <div className="pt-2">
                  <HourlyProgressTimeline
                    timelineHours={historyData.timelineHours}
                    logs={historyData.logs}
                    currentCairoHour={historyData.currentCairoHour}
                    isToday={historyData.isToday}
                    selectedHour={selectedTimelineHour}
                    onSelectHour={(h) => setSelectedTimelineHour(h)}
                  />
                </div>
              )}

              {/* Today's Audit Log Table */}
              {historyData && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold mb-3">
                    Today&apos;s Hourly Records
                  </h3>
                  <MaintenanceHistoryTable
                    logs={historyData.logs}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    showBranchColumn={false}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border p-8 text-center text-muted-foreground">
              No branch assigned to your account. Please contact management.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
