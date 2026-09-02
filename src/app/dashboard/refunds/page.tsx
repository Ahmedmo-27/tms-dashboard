"use client";

import { Suspense } from "react";
import { RefundsPageContent } from "@/components/ui/refunds/refunds-page-content";
import { RefundsSkeleton } from "@/components/ui/loading/refunds-skeleton";

export default function Page() {
  return (
    <Suspense fallback={<RefundsSkeleton />}>
      <RefundsPageContent />
    </Suspense>
  );
}
