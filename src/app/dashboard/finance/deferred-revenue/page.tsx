import { Suspense } from "react";
import type { Metadata } from "next";
import { DeferredView } from "@/components/finance/views/deferred-view";
import { FinanceLoading } from "@/components/finance/finance-page";

export const metadata: Metadata = { title: "Deferred Revenue" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8"><FinanceLoading /></div>}>
      <DeferredView />
    </Suspense>
  );
}
