import { Suspense } from "react";
import type { Metadata } from "next";
import { BranchesView } from "@/components/finance/views/branches-view";
import { FinanceLoading } from "@/components/finance/finance-page";

export const metadata: Metadata = { title: "Branches" };

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-6 lg:p-8"><FinanceLoading /></div>}>
      <BranchesView />
    </Suspense>
  );
}
