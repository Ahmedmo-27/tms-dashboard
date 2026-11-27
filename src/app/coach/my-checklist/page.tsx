"use client";

import { ShadowCoachDashboardTracker } from "@/components/coach/ShadowCoachDashboardTracker";

export default function MyChecklistPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <ShadowCoachDashboardTracker isStandalonePage={true} />
    </div>
  );
}
