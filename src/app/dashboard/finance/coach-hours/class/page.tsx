import { Suspense } from "react";
import type { Metadata } from "next";
import { ClassDetailView } from "@/components/finance/views/class-detail-view";
import { FinanceLoading } from "@/components/finance/finance-page";

export const metadata: Metadata = { title: "Class Detail" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8"><FinanceLoading /></div>}>
      <ClassDetailView />
    </Suspense>
  );
}
