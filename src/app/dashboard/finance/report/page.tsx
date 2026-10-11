import { Suspense } from "react";
import type { Metadata } from "next";
import { ReportView } from "@/components/finance/views/report-view";
import { FinanceLoading } from "@/components/finance/finance-page";

export const metadata: Metadata = { title: "Monthly Report" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8"><FinanceLoading /></div>}>
      <ReportView />
    </Suspense>
  );
}
