import React, { Suspense } from "react";
import { NotificationsContainer } from "@/components/ui/notifications/notifications-container";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Notifications Management | TMS Dashboard",
  description: "Send push and in-app notifications to mobile application users",
};

function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <Skeleton className="h-[500px] w-full rounded-lg" />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div className="flex min-h-full flex-col p-4 sm:p-6">
      <Suspense fallback={<NotificationsLoading />}>
        <NotificationsContainer />
      </Suspense>
    </div>
  );
}
