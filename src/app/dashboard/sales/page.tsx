import React, { Suspense } from "react";
import { SalesAttributionContainer } from "@/components/ui/sales/sales-attribution-container";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sales Attribution | TMS Dashboard",
  description: "Assign sold packages to the sales account that sold them",
};

function SalesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-md" />
    </div>
  );
}

export default function SalesPage() {
  return (
    <div className="flex min-h-full flex-col p-4 sm:p-6">
      <Suspense fallback={<SalesLoading />}>
        <SalesAttributionContainer />
      </Suspense>
    </div>
  );
}
