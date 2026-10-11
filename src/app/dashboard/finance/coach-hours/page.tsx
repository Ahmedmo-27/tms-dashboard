import { Suspense } from "react";
import type { Metadata } from "next";
import { CoachHoursView } from "@/components/finance/views/coach-hours-view";
import { FinanceLoading } from "@/components/finance/finance-page";

export const metadata: Metadata = { title: "Coach Hours" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8"><FinanceLoading /></div>}>
      <CoachHoursView />
    </Suspense>
  );
}
