import type { Metadata } from "next";
import { Suspense } from "react";
import { CoachPtAchievementReport } from "@/components/coach/reports/CoachPtAchievementReport";

export const metadata: Metadata = { title: "PT Achievement Report" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading report…</div>}>
      <CoachPtAchievementReport />
    </Suspense>
  );
}
