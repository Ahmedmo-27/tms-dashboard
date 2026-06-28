export const dynamic = "force-dynamic";
import React from "react";
import OrdersContainer from "@/components/ui/orders/orders-container";
import { getOrders } from "@/lib/data/orders";
import { CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getProducts } from "@/lib/data/products";
import { NetworkError, UnauthorizedError } from "@/core/api-error";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
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
    const orders = await getOrders(locationId);
    const products = await getProducts();
    return (
      <div className="flex min-h-full flex-col gap-8 p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Orders</h1>
              <p className="text-sm text-muted-foreground">
                Track and manage all orders
              </p>
            </div>
          </div>
        </div>
        <Separator />

        {/* Main Content */}
        <div className="flex-1">
          <OrdersContainer orders={orders} initialDate={dateParam} />
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Orders Data Unavailable"
          description="Unable to load orders information due to network issues."
          showBackButton={false}
        />
      );
    } else if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
  }
}
