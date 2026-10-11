import { Suspense } from "react";
import type { Metadata } from "next";
import { CoachPackagesView } from "@/components/finance/views/coach-packages-view";
import { FinanceLoading } from "@/components/finance/finance-page";

export const metadata: Metadata = { title: "Coach Package Tracking" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8"><FinanceLoading /></div>}>
      <CoachPackagesView />
    </Suspense>
  );
}
