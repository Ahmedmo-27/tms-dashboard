"use client";

import React from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Droplets,
  Layers,
  Sparkles,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ManagementOverviewData,
  ManagementBranchCard,
  MaintenanceItemId,
} from "@/lib/data/maintenance";

interface ManagementOverviewGridProps {
  overviewData: ManagementOverviewData;
  onSelectBranch: (branchId: string) => void;
}

const ITEM_ICONS: Record<
  MaintenanceItemId,
  React.ComponentType<{ className?: string }>
> = {
  showers_bottles: Droplets,
  towels: Layers,
  communal_area: Sparkles,
  gym_prepared: Dumbbell,
};

export function ManagementOverviewGrid({
  overviewData,
  onSelectBranch,
}: ManagementOverviewGridProps) {
  const { branches, overallCompliance } = overviewData;

  return (
    <div className="space-y-6">
      {/* Overview Stat Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Branches Monitored
            </div>
            <div className="text-2xl font-bold">{branches.length}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Today&apos;s Space Compliance
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{overallCompliance}%</span>
              <Badge
                variant="outline"
                className={
                  overallCompliance >= 85
                    ? "text-emerald-600 border-emerald-300"
                    : overallCompliance >= 70
                    ? "text-amber-600 border-amber-300"
                    : "text-rose-600 border-rose-300"
                }
              >
                {overallCompliance >= 85 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Current Hour Status
            </div>
            <div className="text-sm font-semibold">
              {branches.filter((b) => b.currentHour.overallStatus === "completed").length} of{" "}
              {branches.length} Branches Completed
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch: ManagementBranchCard) => {
          const isComplete = branch.currentHour.overallStatus === "completed";
          const inProgress = branch.currentHour.overallStatus === "in_progress";

          return (
            <div
              key={branch.locationId}
              className={`flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                isComplete
                  ? "border-emerald-500/30 bg-card"
                  : inProgress
                  ? "border-amber-500/30 bg-card"
                  : "border-border bg-card"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-base">
                      {branch.branchName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {branch.location}
                    </p>
                  </div>

                  <Badge
                    className={
                      isComplete
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                        : inProgress
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        : "bg-rose-100 text-rose-800 hover:bg-rose-100"
                    }
                  >
                    {isComplete
                      ? "Completed (4/4)"
                      : inProgress
                      ? `In Progress (${branch.currentHour.completedCount}/4)`
                      : "Not Checked"}
                  </Badge>
                </div>

                {/* Items Pill Indicators */}
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {branch.currentHour.items.map((item) => {
                    const Icon = ITEM_ICONS[item.id];
                    return (
                      <div
                        key={item.id}
                        title={`${item.title}: ${
                          item.isCompleted ? "Completed" : "Pending"
                        }`}
                        className={`flex flex-col items-center justify-center rounded-lg py-2 transition-colors ${
                          item.isCompleted
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-muted text-muted-foreground/60"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[10px] mt-0.5 truncate max-w-full px-1">
                          {item.id === "showers_bottles"
                            ? "Showers"
                            : item.id === "towels"
                            ? "Towels"
                            : item.id === "communal_area"
                            ? "Communal"
                            : "Gym"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Inspector Info */}
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {branch.currentHour.lastUpdatedByName ? (
                        <span className="font-medium text-foreground">
                          {branch.currentHour.lastUpdatedByName}
                        </span>
                      ) : (
                        <span className="italic">No inspector yet</span>
                      )}
                    </span>
                  </div>

                  {branch.currentHour.lastUpdatedAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        Checked at{" "}
                        {new Date(
                          branch.currentHour.lastUpdatedAt
                        ).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Today's Compliance Progress */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Today&apos;s Compliance
                    </span>
                    <span className="font-medium">
                      {branch.todayStats.complianceRate}% (
                      {branch.todayStats.completedHours}/
                      {branch.todayStats.elapsedOperatingHours} hrs)
                    </span>
                  </div>
                  <Progress
                    value={branch.todayStats.complianceRate}
                    className="h-1.5"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectBranch(branch.locationId)}
                  className="w-full justify-between"
                >
                  <span>View Branch Checklist</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
