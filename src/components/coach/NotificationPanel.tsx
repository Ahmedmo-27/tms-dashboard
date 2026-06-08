"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { markAllNotificationsRead } from "@/lib/store/features/coachSlice";
import type { CoachNotification } from "@/lib/store/features/coachSlice";
import type { RootState } from "@/lib/store/store";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";

export function NotificationPanel() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state: RootState) => state.coach.notifications) as CoachNotification[];

  // Mark all as read when panel is mounted/opened
  useEffect(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Bell className="h-10 w-10 opacity-30" />
        <p className="text-sm">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h2 className="font-semibold text-sm mb-3">Notifications</h2>
      <div className="divide-y rounded-lg border overflow-hidden">
        {notifications.map((n: CoachNotification) => {
          const relativeTime = formatDistanceToNow(new Date(n.createdAt), {
            addSuffix: true,
          });

          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                !n.read ? "bg-primary/5" : ""
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {n.memberName}{" "}
                  <span className="font-normal text-muted-foreground">
                    was assigned
                  </span>{" "}
                  {n.packageName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {n.classesTotal} class{n.classesTotal !== 1 ? "es" : ""} ·{" "}
                  {relativeTime}
                </p>
              </div>
              {!n.read && (
                <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
