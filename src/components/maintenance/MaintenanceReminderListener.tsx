"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { toPermissionRole } from "@/lib/config/roles";
import { getCurrentMaintenanceSlot, CurrentSlotData } from "@/lib/data/maintenance";
import {
  getCurrentMilestone,
  playReminderSound,
  ReminderMilestone,
} from "@/lib/utils/maintenance-reminder";
import toast from "react-hot-toast";
import { AlertTriangle, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaintenanceReminderListener() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const permissionRole = toPermissionRole(user?.role as string | undefined);
  const userLocationId = (user as any)?.locationId?.toString() || null;

  // Track which milestones have been alerted for which hour slot (format: `${slotHour}-${milestone}`)
  const alertedMilestonesRef = useRef<Set<string>>(new Set());
  const currentSlotHourRef = useRef<number | null>(null);

  const isBranchAdmin = permissionRole === "branch_admin";

  useEffect(() => {
    // Only branch_admin has assigned location duties requiring continuous hourly reminders
    if (!isBranchAdmin || !userLocationId) return;

    let mounted = true;

    async function checkMaintenanceStatus() {
      try {
        const slotData: CurrentSlotData = await getCurrentMaintenanceSlot(userLocationId);
        if (!mounted || !slotData) return;

        // Reset alerted set when hour changes
        if (currentSlotHourRef.current !== slotData.slotHour) {
          currentSlotHourRef.current = slotData.slotHour;
          alertedMilestonesRef.current.clear();
        }

        const uncheckedItems = slotData.items.filter((i) => !i.isCompleted);

        // If all items are completed, nothing to remind
        if (uncheckedItems.length === 0) return;

        // Calculate Cairo minute from slotStartTime or current time
        const now = new Date();
        const minutesPastHour = now.getMinutes();
        const milestone = getCurrentMilestone(minutesPastHour);

        if (!milestone) return;

        const alertKey = `${slotData.slotHour}-${milestone}`;
        if (alertedMilestonesRef.current.has(alertKey)) return;

        // Mark as alerted for this hour
        alertedMilestonesRef.current.add(alertKey);

        const isUrgent = milestone === "45m" || milestone === "55m";
        const minutesLeft = Math.max(1, 60 - minutesPastHour);

        // Play audio chime
        playReminderSound(isUrgent);

        // Display custom interactive toast
        toast.custom(
          (t) => (
            <div
              className={`flex w-full max-w-md items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all ${
                t.visible ? "animate-enter opacity-100" : "animate-leave opacity-0"
              } ${
                isUrgent
                  ? "border-rose-500/40 bg-card/95 text-foreground ring-2 ring-rose-500/20"
                  : "border-amber-500/40 bg-card/95 text-foreground ring-1 ring-amber-500/20"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isUrgent
                    ? "bg-rose-500/15 text-rose-600 animate-pulse"
                    : "bg-amber-500/15 text-amber-600"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-semibold">
                    {isUrgent ? "⚠️ Urgent Space Check Needed" : "⏰ Hourly Maintenance Reminder"}
                  </h4>
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {minutesLeft}m left
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {uncheckedItems.length} {uncheckedItems.length === 1 ? "area needs" : "areas need"} checking before the hourly reset:
                </p>

                <div className="mt-1.5 flex flex-wrap gap-1">
                  {uncheckedItems.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {item.title}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.dismiss(t.id)}
                    className="h-7 text-xs"
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.dismiss(t.id);
                      router.push("/dashboard/maintenance");
                    }}
                    className={`h-7 gap-1 text-xs text-white ${
                      isUrgent ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:bg-primary/90"
                    }`}
                  >
                    <span>Open Checklist</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ),
          {
            duration: isUrgent ? 12000 : 8000,
            position: "top-right",
          }
        );
      } catch (err) {
        // Silent error in background polling
      }
    }

    // Initial check
    checkMaintenanceStatus();

    // Poll every 45 seconds to catch minute milestones
    const interval = setInterval(checkMaintenanceStatus, 45000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isBranchAdmin, userLocationId, router]);

  return null;
}
