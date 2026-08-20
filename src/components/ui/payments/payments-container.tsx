"use client";

import { Payment, columns } from "./columns";
import { DataTable } from "./data-table";
import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { Input } from "../input";
import { Button } from "../button";
import { Badge } from "../badge";
import {
  Search,
  RefreshCw,
  Download,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../dropdown-menu";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { PaymentDatePicker } from "./date-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDate } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { isOutflowTransaction } from "@/lib/utils/parsers/payments-parser";
import { ExportPaymentsDialog } from "./export-payments-dialog";
import { CopyPaymentsForSheetButton } from "./copy-payments-for-sheet-button";

export default function PaymentsContainer({
  payments,
  initialDate,
}: {
  payments: Payment[];
  initialDate?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"all" | "payments" | "refunds">("all");

  const isOutflow = (payment: Payment) => isOutflowTransaction(payment);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined
  );

  // Calculate payment statistics
  const stats = useMemo(() => {
    const totalAmount = payments.reduce((sum, payment) => {
      const amountStr = typeof payment.amount === 'string' ? payment.amount : String(payment.amount);
      const numericAmount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ""));
      const val = isNaN(numericAmount) ? 0 : Math.abs(numericAmount);
      
      if (isOutflow(payment)) {
        return sum - val;
      }
      return sum + val;
    }, 0);

    const todayPayments = payments.filter((payment) => {
      const timeZone = "Africa/Cairo";
      const paymentDate = formatInTimeZone(new Date(payment.paymentTime), timeZone, "MM/dd/yyyy");
      const today = formatInTimeZone(new Date(), timeZone, "MM/dd/yyyy");
      return paymentDate === today;
    });

    const uniqueMembers = new Set(payments.map((p) => p.memberName)).size;

    const paymentMethods = payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAmount,
      totalPayments: payments.filter((p) => !isOutflow(p)).length,
      todayPayments: todayPayments.length,
      uniqueMembers,
      paymentMethods,
    };
  }, [payments]);

  // Filter payments based on search and method
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        searchTerm === "" ||
        (payment.memberName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.phone ?? "").includes(searchTerm) ||
        (payment.purpose ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.refundReason ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod =
        selectedMethod === null || payment.paymentMethod === selectedMethod;

      const matchesType = 
        selectedType === "all" || 
        (selectedType === "payments" && !isOutflow(payment)) ||
        (selectedType === "refunds" && isOutflow(payment));

      return matchesSearch && matchesMethod && matchesType;
    });
  }, [payments, searchTerm, selectedMethod, selectedType]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
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
    router.push(`/dashboard/payments?${params.toString()}`);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    router.push(`/dashboard/payments?${params.toString()}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Statistics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Total Revenue
                </p>
                <p className="text-lg sm:text-2xl font-bold truncate">
                  ${stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Total Payments
                </p>
                <p className="text-lg sm:text-2xl font-bold">{stats.totalPayments}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Today's Payments
                </p>
                <p className="text-lg sm:text-2xl font-bold">{stats.todayPayments}</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Unique Members
                </p>
                <p className="text-lg sm:text-2xl font-bold">{stats.uniqueMembers}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Payment Transactions</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {filteredPayments.length} of {payments.length} payments
                {selectedDate && (
                  <span className="ml-1 sm:ml-2 text-primary">
                    for {format(selectedDate, "MMM dd, yyyy")}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                <PaymentDatePicker
                  className="w-full sm:w-[200px]"
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  placeholder="Filter by date"
                />
                {selectedDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilter}
                    className="h-9 w-9 p-0 shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear date filter</span>
                  </Button>
                )}
              </div>

              <div className="relative w-full sm:min-w-[180px] sm:flex-1 sm:max-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-[calc(50%-0.25rem)] sm:w-auto shrink-0 justify-center"
                  >
                    <span className="truncate">
                      {selectedType === "all"
                        ? "All Types"
                        : selectedType === "payments"
                          ? "Payments Only"
                          : "Refunds & Cash Outs"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedType("all")}>
                    All Types
                    <Badge variant="outline" className="ml-auto">
                      {payments.length}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("payments")}>
                    Payments Only
                    <Badge variant="outline" className="ml-auto">
                      {payments.filter((p) => !isOutflow(p)).length}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType("refunds")}>
                    Refunds & Cash Outs
                    <Badge variant="outline" className="ml-auto">
                      {payments.filter((p) => isOutflow(p)).length}
                    </Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-[calc(50%-0.25rem)] sm:w-auto shrink-0 justify-center"
                  >
                    <span className="truncate">{selectedMethod || "All Methods"}</span>
                    {selectedMethod && (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {stats.paymentMethods[selectedMethod]}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Payment Methods</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedMethod(null)}>
                    All Methods
                    <Badge variant="outline" className="ml-auto">
                      {payments.length}
                    </Badge>
                  </DropdownMenuItem>
                  {Object.entries(stats.paymentMethods).map(
                    ([method, count]) => (
                      <DropdownMenuItem
                        key={method}
                        onClick={() => setSelectedMethod(method)}
                      >
                        {method}
                        <Badge variant="outline" className="ml-auto">
                          {count}
                        </Badge>
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 flex-1 sm:flex-none"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4 sm:mr-2",
                      isRefreshing && "animate-spin"
                    )}
                  />
                  <span>Refresh</span>
                </Button>

                <CopyPaymentsForSheetButton payments={filteredPayments} />

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 sm:flex-none"
                  onClick={() => setExportOpen(true)}
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <ExportPaymentsDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
        />

        <CardContent className="p-0 sm:p-6">
          <div className="rounded-md border overflow-hidden">
            <DataTable columns={columns} data={filteredPayments} />
            {filteredPayments.length === 0 && payments.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  No payments found
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
                    setSelectedMethod(null);
                    setSelectedType("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
            {payments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No payments yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Payment transactions will appear here once they are recorded
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
