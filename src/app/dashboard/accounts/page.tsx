import React, { Suspense } from "react";
import { AccountsContainer } from "@/components/ui/accounts/accounts-container";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Accounts Management | TMS Dashboard",
  description: "User and staff account administration",
};

function AccountsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-md" />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <div className="flex min-h-full flex-col p-4 sm:p-6">
      <Suspense fallback={<AccountsLoading />}>
        <AccountsContainer />
      </Suspense>
    </div>
  );
}

