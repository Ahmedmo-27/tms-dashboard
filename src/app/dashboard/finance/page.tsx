import { Suspense } from "react";
import type { Metadata } from "next";
import { OverviewView } from "@/components/finance/views/overview-view";
import { FinanceLoading } from "@/components/finance/finance-page";

export const metadata: Metadata = { title: "Finance Overview" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8"><FinanceLoading /></div>}>
      <OverviewView />
    </Suspense>
  );
}
