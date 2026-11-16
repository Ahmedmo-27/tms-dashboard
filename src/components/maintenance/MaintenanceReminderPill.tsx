"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Loader2,
  Droplets,
  Layers,
  Sparkles,
  Dumbbell,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/lib/hooks";
import { toPermissionRole } from "@/lib/config/roles";
import {
  getCurrentMaintenanceSlot,
  updateMaintenanceItem,
  CurrentSlotData,
  MaintenanceItemId,
  MaintenanceCheckItem,
} from "@/lib/data/maintenance";
import toast from "react-hot-toast";

const ITEM_ICONS: Record<
  MaintenanceItemId,
  React.ComponentType<{ className?: string }>
> = {
  showers_bottles: Droplets,
  towels: Layers,
  communal_area: Sparkles,
  gym_prepared: Dumbbell,
};

export function MaintenanceReminderPill() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const permissionRole = toPermissionRole(user?.role as string | undefined);
  const userLocationId = (user as any)?.locationId?.toString() || null;

  const [slotData, setSlotData] = useState<CurrentSlotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const isStaffEligible =
    permissionRole === "branch_admin" || permissionRole === "management";

  const fetchStatus = useCallback(async () => {
    if (!isStaffEligible || !userLocationId) return;
    try {
      const data = await getCurrentMaintenanceSlot(userLocationId);
      setSlotData(data);
    } catch {
      // Background fetch silence
    }
  }, [isStaffEligible, userLocationId]);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (!isStaffEligible || !userLocationId || !slotData) {
    return null;
  }

  const uncheckedCount = slotData.items.filter((i) => !i.isCompleted).length;
  const allCompleted = uncheckedCount === 0;
  const minutesLeft = Math.floor(slotData.secondsRemainingInHour / 60);
  const isUrgent = uncheckedCount > 0 && minutesLeft < 15;

  const handleQuickToggle = async (item: MaintenanceCheckItem) => {
    try {
      setUpdatingItemId(item.id);
      await updateMaintenanceItem({
        locationId: userLocationId,
        itemId: item.id,
        isCompleted: !item.isCompleted,
      });
      await fetchStatus();
      toast.success(
        !item.isCompleted ? `Checked "${item.title}"` : `Unchecked "${item.title}"`
      );
    } catch {
      toast.error("Failed to update item");
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all shadow-sm cursor-pointer ${
            allCompleted
              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
              : isUrgent
              ? "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 ring-1 ring-rose-500/30 animate-pulse dark:text-rose-400"
              : "bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 ring-1 ring-amber-500/30 dark:text-amber-400"
          }`}
        >
          {allCompleted ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline font-semibold">Space Clean</span>
              <span className="sm:hidden font-semibold">4/4</span>
            </>
          ) : (
            <>
              <AlertTriangle
                className={`h-3.5 w-3.5 ${
                  isUrgent ? "text-rose-600" : "text-amber-600"
                }`}
              />
              <span className="font-semibold">
                {uncheckedCount} unchecked
              </span>
              <span className="text-[10px] opacity-75">
                • {minutesLeft}m left
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-lg" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-3 bg-muted/40">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Hourly Space Inspection</h4>
          </div>
          <Badge
            variant={allCompleted ? "default" : "outline"}
            className={
              allCompleted
                ? "bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]"
                : "text-[10px]"
            }
          >
            {slotData.completedCount}/{slotData.totalCount} Done
          </Badge>
        </div>

        {/* Quick Items List */}
        <div className="p-2 space-y-1">
          {slotData.items.map((item) => {
            const Icon = ITEM_ICONS[item.id];
            const isUpdating = updatingItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => !isUpdating && handleQuickToggle(item)}
                className={`flex items-center justify-between gap-2 rounded-lg p-2 transition-colors cursor-pointer ${
                  item.isCompleted
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                      item.isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={`text-xs truncate ${
                      item.isCompleted ? "line-through opacity-80" : "font-medium"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className="shrink-0">
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : item.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t p-2.5 bg-muted/20">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Resets in {minutesLeft} mins</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard/maintenance");
            }}
            className="h-7 text-xs gap-1 text-primary hover:text-primary"
          >
            <span>Full Checklist</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
