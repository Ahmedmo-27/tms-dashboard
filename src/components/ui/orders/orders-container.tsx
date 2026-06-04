"use client";

import { Order, OrderItem, columns } from "./columns";
import { DataTable } from "./data-table";
import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { Input } from "../input";
import { Button } from "../button";
import {
  Search,
  RefreshCw,
  Download,
  DollarSign,
  TrendingUp,
  Calendar,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { PaymentDatePicker } from "@/components/ui/payments/date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDate } from "date-fns";

export default function OrdersContainer({
  orders,
  initialDate,
}: {
  orders: Order[];
  initialDate?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined
  );

  // Calculate order statistics
  const stats = useMemo(() => {
    const totalAmount = orders.reduce((sum, order) => {
      const amount = order.total;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const todayOrders = orders.filter((order) => {
      const orderDate = new Date(order.date).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      return orderDate === today;
    });

    return {
      totalAmount,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
    };
  }, [orders]);

  // Filter payments based on search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        searchTerm === "" ||
        order.items.some((item) => item.item.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [orders, searchTerm]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);

    // Create new URL with date parameter
    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      // Convert to UTC date string (YYYY-MM-DD format)
      const utcDateString = formatDate(date, "yyyy-MM-dd"); 
      params.set("date", utcDateString);
    } else {
      params.delete("date");
    }

    // Navigate to new URL
    router.push(`/dashboard/orders?${params.toString()}`);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    router.push(`/dashboard/orders?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">
                  ${stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Payments
                </p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Payments
                </p>
                <p className="text-2xl font-bold">{stats.todayOrders}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredOrders.length} of {orders.length} orders
                {selectedDate && (
                  <span className="ml-2 text-primary">
                    for {format(selectedDate, "MMM dd, yyyy")}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              {/* Date Picker */}
              <div className="flex items-center gap-2">
                <PaymentDatePicker
                  className="w-full md:w-[200px]"
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  placeholder="Filter by date"
                />
                {selectedDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilter}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-4 w-full md:w-[250px]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn(
                      "mr-2 h-4 w-4",
                      isRefreshing && "animate-spin"
                    )}
                  />
                  Refresh
                </Button>

                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <DataTable columns={columns} data={filteredOrders} />
            {filteredOrders.length === 0 && orders.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  No orders found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Orders will appear here once they are recorded
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
