"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, PieChart, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { financeApi, type SalesData, type SalesRow } from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { BarList, ColumnChart, ShareBar } from "../charts";
import { downloadCsv } from "../csv";
import { DataTable, type DataColumn } from "../data-table";
import { FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatBucket, formatDateTime, formatMoney, formatNumber, formatPercent } from "../format";
import { methodLabel, segmentLabel } from "../labels";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData, useFinanceFilters } from "../use-finance-data";

const PAGE_SIZE = 25;
const METHOD_ORDER = ["CASH", "VISA", "INSTAPAY", "APP", "PAYMENT_LINK", "VALU"];

export function SalesView() {
  const { searchParams, setParams, startDate, endDate, locationId } = useFinanceFilters();
  const segment = searchParams.get("segment") ?? "ALL";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const [exporting, setExporting] = useState(false);

  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== search) setParams({ search: searchInput || undefined, page: undefined });
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput, search, setParams]);

  const { data, loading, error, reload } = useFinanceData(financeApi.sales, {
    segment,
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const exportAll = async () => {
    setExporting(true);
    try {
      const full = await financeApi.sales({
        startDate,
        endDate,
        locationId,
        segment,
        search: search || undefined,
        limit: 10000,
      });
      downloadCsv(`sales-${segment.toLowerCase()}-${startDate}-to-${endDate}`, full.payments.rows, [
        { header: "Date", value: (r) => formatDateTime(r.time) },
        { header: "Customer", value: (r) => r.customer },
        { header: "Phone", value: (r) => r.phone },
        { header: "Type", value: (r) => segmentLabel(r.segment) },
        { header: "Item", value: (r) => r.item },
        { header: "Method", value: (r) => methodLabel(r.method) },
        { header: "Amount (EGP)", value: (r) => r.amount },
        { header: "List price (EGP)", value: (r) => r.listPrice ?? "" },
        { header: "Discount (EGP)", value: (r) => r.discount },
        { header: "Branch", value: (r) => r.branch },
        { header: "Refunded", value: (r) => (r.isRefunded ? "Yes" : "No") },
        { header: "Reference", value: (r) => r.reference },
      ]);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <FinancePage
      title="Sales"
      description="Packages by category and drop-ins, with every payment behind the numbers."
      icon={PieChart}
      actions={
        <Button variant="outline" size="sm" className="h-10 gap-1.5" disabled={!data || exporting} onClick={exportAll}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
      }
    >
      {error ? (
        <FinanceError message={error} onRetry={reload} />
      ) : loading && !data ? (
        <FinanceLoading tiles={5} />
      ) : data ? (
        <div className={cn("flex flex-col gap-5 transition-opacity", loading && "opacity-60")}>
          <SegmentPicker
            data={data}
            active={segment}
            onSelect={(next) => setParams({ segment: next === "ALL" ? undefined : next, page: undefined })}
          />
          <SalesBody data={data} />
          <Card className="gap-3 shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
              <CardTitle className="text-sm font-semibold">
                Payments{segment !== "ALL" && ` · ${segmentLabel(segment)}`}
                <span className="ml-2 font-normal text-muted-foreground">{formatNumber(data.payments.total)}</span>
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search customer, phone, item, reference"
                  className="h-9 pl-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={paymentColumns}
                rows={data.payments.rows}
                rowKey={(r) => r.id}
                serverPaging={{
                  page: data.payments.page,
                  totalPages: data.payments.totalPages,
                  total: data.payments.total,
                  pageSize: data.payments.limit,
                  onPageChange: (next) => setParams({ page: String(next) }),
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </FinancePage>
  );
}

function SegmentPicker({
  data,
  active,
  onSelect,
}: {
  data: SalesData;
  active: string;
  onSelect: (segment: string) => void;
}) {
  const all = data.segments.reduce((s, x) => s + x.amount, 0);
  const options = [{ segment: "ALL", amount: all, change: null as number | null }, ...data.segments];
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Sales type">
      {options.map((option) => {
        const selected = option.segment === active;
        return (
          <button
            key={option.segment}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(option.segment)}
            className={cn(
              "flex min-w-[140px] shrink-0 cursor-pointer flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted/60",
            )}
          >
            <span className={cn("text-[11px] font-medium", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
              {option.segment === "ALL" ? "All sales" : segmentLabel(option.segment)}
            </span>
            <span className="text-sm font-semibold tabular-nums">{formatMoney(option.amount)}</span>
          </button>
        );
      })}
    </div>
  );
}

function SalesBody({ data }: { data: SalesData }) {
  const t = data.totals;
  const current = data.segments.find((s) => s.segment === data.segment);
  const methods = [...data.byMethod].sort((a, b) => METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method));
  const isPackage = !["ALL", "DROPIN", "NON_MEMBER_DROPIN", "WALKIN", "OTHER"].includes(data.segment);

  return (
    <>
      <StatGrid className="xl:grid-cols-5">
        <StatTile label="Revenue" value={formatMoney(t.amount)} delta={current?.change ?? undefined} hint={current ? "vs previous period" : undefined} emphasis />
        <StatTile label="Payments" value={formatNumber(t.count)} />
        <StatTile label="Average payment" value={formatMoney(t.avgTicket)} />
        <StatTile label="Unique customers" value={formatNumber(t.uniqueCustomers)} />
        <StatTile
          label="Paid below list price"
          value={formatMoney(t.discountTotal)}
          upIs="bad"
          hint={`${t.discountedCount} payments · ${formatPercent(t.discountRate)} of list value`}
        />
      </StatGrid>

      <div className="grid gap-5 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="Revenue over time"
          description="Total collected in each period."
          table={{
            rows: data.trend,
            columns: [
              { key: "bucket", header: "Period", cell: (r) => formatBucket(r.bucket, true) },
              { key: "count", header: "Payments", align: "right", cell: (r) => formatNumber(r.count) },
              { key: "amount", header: "Revenue", align: "right", cell: (r) => formatMoney(r.amount), sortValue: (r) => r.amount },
            ],
          }}
        >
          <ColumnChart
            data={data.trend}
            format={formatMoney}
            series={[{ key: "amount", label: "Revenue", color: "var(--viz-1)" }]}
          />
        </ChartCard>
        <ChartCard
          className="lg:col-span-2"
          title="Payment methods"
          description="How this revenue was paid."
          table={{
            rows: methods,
            columns: [
              { key: "method", header: "Method", cell: (r) => methodLabel(r.method) },
              { key: "count", header: "Payments", align: "right", cell: (r) => formatNumber(r.count) },
              { key: "amount", header: "Amount", align: "right", cell: (r) => formatMoney(r.amount) },
            ],
          }}
        >
          <ShareBar
            format={formatMoney}
            parts={methods.map((m) => ({
              key: m.method,
              label: methodLabel(m.method),
              value: m.amount,
              color: `var(--viz-${Math.max(0, METHOD_ORDER.indexOf(m.method)) + 1})`,
            }))}
          />
        </ChartCard>
      </div>

      <ChartCard
        title={isPackage ? "Top packages" : "Top items"}
        description="Ranked by revenue. Discount is the gap between list price and what was paid."
        table={{
          rows: data.topItems,
          columns: [
            { key: "name", header: "Item", cell: (r) => r.name },
            { key: "count", header: "Sold", align: "right", cell: (r) => formatNumber(r.count), sortValue: (r) => r.count },
            { key: "list", header: "List price", align: "right", cell: (r) => formatMoney(r.listPrice) },
            { key: "avg", header: "Avg paid", align: "right", cell: (r) => formatMoney(r.avgPaid) },
            { key: "discount", header: "Discounts", align: "right", cell: (r) => formatMoney(r.discount), sortValue: (r) => r.discount },
            { key: "amount", header: "Revenue", align: "right", cell: (r) => formatMoney(r.amount), sortValue: (r) => r.amount },
          ],
        }}
      >
        <BarList
          format={formatMoney}
          items={data.topItems.map((item) => ({
            key: item.name,
            label: item.name,
            value: item.amount,
            secondary: `${item.count} sold`,
          }))}
        />
      </ChartCard>
    </>
  );
}

const paymentColumns: DataColumn<SalesRow>[] = [
  { key: "time", header: "Date", cell: (r) => <span className="whitespace-nowrap">{formatDateTime(r.time)}</span> },
  {
    key: "customer",
    header: "Customer",
    cell: (r) => (
      <div className="min-w-[140px]">
        <p className="font-medium">{r.customer}</p>
        {r.phone && <p className="text-[11px] text-muted-foreground">{r.phone}</p>}
      </div>
    ),
  },
  {
    key: "item",
    header: "Item",
    cell: (r) => (
      <div className="min-w-[140px]">
        <p>{r.item}</p>
        <p className="text-[11px] text-muted-foreground">{segmentLabel(r.segment)}</p>
      </div>
    ),
  },
  { key: "method", header: "Method", cell: (r) => methodLabel(r.method) },
  { key: "branch", header: "Branch", cell: (r) => r.branch },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => (
      <div className="whitespace-nowrap">
        <p className="font-medium">{formatMoney(r.amount)}</p>
        {r.discount > 0 && <p className="text-[11px] text-muted-foreground">−{formatMoney(r.discount)} off list</p>}
        {r.isRefunded && (
          <Badge variant="outline" className="mt-0.5 text-[10px]">
            Refunded
          </Badge>
        )}
      </div>
    ),
  },
];
