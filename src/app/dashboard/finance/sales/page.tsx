import { Suspense } from "react";
import type { Metadata } from "next";
import { SalesView } from "@/components/finance/views/sales-view";
import { FinanceLoading } from "@/components/finance/finance-page";

export const metadata: Metadata = { title: "Sales" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8"><FinanceLoading /></div>}>
      <SalesView />
    </Suspense>
  );
}
