export const dynamic = "force-dynamic";
import React from "react";
import PaymentsContainer from "@/components/ui/payments/payments-container";
import { getPayments } from "@/lib/data/payments";
import { CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export default async function Page({
  searchParams,
}: {
  searchParams: { date?: string; locationId?: string };
}) {
  const params = await searchParams;
  const dateParam = params.date
    ? new Date(params.date).toLocaleString().split("T")[0]
    : new Date().toLocaleString().split("T")[0];
  const locationId = params.locationId;
  try {
    const payments = await getPayments(dateParam, locationId);
    return (
      <div className="flex min-h-full flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Payments</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Track and manage all payment transactions
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Main Content */}
        <div className="flex-1">
          <PaymentsContainer payments={payments} initialDate={dateParam} />
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Payments Data Unavailable"
          description="Unable to load payments information due to network issues."
          showBackButton={false}
        />
      );
    } else if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
  }
}
