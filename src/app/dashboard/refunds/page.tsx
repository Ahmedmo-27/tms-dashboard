"use client";

import { Suspense } from "react";
import { RefundsPageContent } from "@/components/ui/refunds/refunds-page-content";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RefundsPageContent />
    </Suspense>
  );
}
