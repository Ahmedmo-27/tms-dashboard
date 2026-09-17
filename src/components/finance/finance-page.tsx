"use client";

import type { ComponentType, ReactNode } from "react";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { PaymentDateRangePicker } from "@/components/ui/payments/payment-date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/lib/hooks";
import { isAccountantRole } from "@/lib/config/roles";
import { useFinanceFilters } from "./use-finance-data";

type FinancePageProps = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  /** Extra filters shown next to the date range. */
  filters?: ReactNode;
  showDateRange?: boolean;
  note?: ReactNode;
  children: ReactNode;
};

export function FinancePage({
  title,
  description,
  icon: Icon,
  actions,
  filters,
  showDateRange = true,
  note,
  children,
}: FinancePageProps) {
  const role = useAppSelector((state) => state.auth.user?.role as string | undefined);
  const { startDate, endDate, setParams } = useFinanceFilters();

  const range = useMemo<DateRange>(
    () => ({ from: parseISO(startDate), to: parseISO(endDate) }),
    [startDate, endDate],
  );

  return (
    <div className="flex min-h-full flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
              {isAccountantRole(role) && (
                <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  View only
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          {showDateRange && (
            <PaymentDateRangePicker
              className="w-full sm:w-[260px]"
              dateRange={range}
              onDateRangeChange={(next) => {
                if (!next?.from) return;
                setParams({
                  startDate: format(next.from, "yyyy-MM-dd"),
                  endDate: format(next.to ?? next.from, "yyyy-MM-dd"),
                  page: undefined,
                });
              }}
            />
          )}
          {actions}
        </div>
      </div>
      {note}
      {children}
    </div>
  );
}

export function FinanceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium">This data could not be loaded</p>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

export function FinanceLoading({ tiles = 4, charts = 2 }: { tiles?: number; charts?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: tiles }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: charts }).map((_, i) => (
          <Skeleton key={i} className="h-[320px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
