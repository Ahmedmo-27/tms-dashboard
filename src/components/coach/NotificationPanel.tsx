"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { markAllNotificationsRead } from "@/lib/store/features/coachSlice";
import type { CoachNotification } from "@/lib/store/features/coachSlice";
import type { RootState } from "@/lib/store/store";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";

export function NotificationPanel({ onSelect }: { onSelect?: () => void }) {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(
    (state: RootState) => state.coach.notifications
  ) as CoachNotification[];

  useEffect(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Bell className="h-10 w-10 opacity-30" />
        <p className="text-sm">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y overflow-hidden rounded-lg border">
      {notifications.map((n: CoachNotification) => {
        const relativeTime = formatDistanceToNow(new Date(n.createdAt), {
          addSuffix: true,
        });
        const href = n.memberId
          ? `/coach/clients/${n.memberId}`
          : undefined;

        const body = (
          <>
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
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </>
        );

        if (href) {
          return (
            <Link
              key={n.id}
              href={href}
              onClick={onSelect}
              className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                !n.read ? "bg-primary/5" : ""
              }`}
            >
              {body}
            </Link>
          );
        }

        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 ${
              !n.read ? "bg-primary/5" : ""
            }`}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}
