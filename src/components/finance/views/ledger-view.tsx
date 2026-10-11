"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BookOpenCheck, Download, Loader2, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { financeApi, type LedgerData, type LedgerRow, type RefundsData } from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { BarList, ColumnChart } from "../charts";
import { downloadCsv, type CsvColumn } from "../csv";
import { DataTable, type DataColumn } from "../data-table";
import { FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatBucket, formatDate, formatDateTime, formatMoney, formatNumber, formatPercent } from "../format";
import { flagLabel, methodLabel, segmentLabel, METHOD_LABELS } from "../labels";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData, useFinanceFilters } from "../use-finance-data";

const PAGE_SIZE = 30;

const ledgerCsv: CsvColumn<LedgerRow>[] = [
  { header: "Date", value: (r) => formatDateTime(r.time) },
  { header: "Kind", value: (r) => r.kind },
  { header: "Customer", value: (r) => r.customer },
  { header: "Phone", value: (r) => r.phone },
  { header: "Item / reason", value: (r) => r.item },
  { header: "Type", value: (r) => segmentLabel(r.segment) },
  { header: "Method", value: (r) => methodLabel(r.method) },
  { header: "Amount (EGP)", value: (r) => r.amount },
  { header: "Counts as revenue", value: (r) => (r.countsAsRevenue ? "Yes" : "No") },
  { header: "Branch", value: (r) => r.branch },
  { header: "Reference", value: (r) => r.reference },
  { header: "Recorded by", value: (r) => r.recordedBy },
  { header: "Flags", value: (r) => r.flags.map(flagLabel).join("; ") },
];

export function LedgerView() {
  const { searchParams, setParams } = useFinanceFilters();
  const tab = searchParams.get("tab") ?? "transactions";

  return (
    <FinancePage
      title="Ledger & Refunds"
      description="Every transaction, the daily cash check, and money that went back out."
      icon={BookOpenCheck}
    >
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v === "transactions" ? undefined : v, page: undefined })}>
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="cash">Cash check</TabsTrigger>
          <TabsTrigger value="refunds">Refunds & cash outs</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          {tab === "transactions" && <TransactionsTab />}
        </TabsContent>
        <TabsContent value="cash" className="mt-4">
          {tab === "cash" && <CashTab />}
        </TabsContent>
        <TabsContent value="refunds" className="mt-4">
          {tab === "refunds" && <RefundsTab />}
        </TabsContent>
      </Tabs>
    </FinancePage>
  );
}

function TransactionsTab() {
  const { searchParams, setParams, startDate, endDate, locationId } = useFinanceFilters();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const type = searchParams.get("type") ?? "ALL";
  const method = searchParams.get("method") ?? "ALL";
  const flaggedOnly = searchParams.get("flagged") === "1";
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

  const query = { page, limit: PAGE_SIZE, type, method, flaggedOnly, search: search || undefined };
  const { data, loading, error, reload } = useFinanceData(financeApi.ledger, query);

  const exportAll = async () => {
    setExporting(true);
    try {
      const full = await financeApi.ledger({ ...query, page: 1, limit: 10000, startDate, endDate, locationId });
      downloadCsv(`ledger-${startDate}-to-${endDate}`, full.transactions.rows, ledgerCsv);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (error) return <FinanceError message={error} onRetry={reload} />;
  if (loading && !data) return <FinanceLoading tiles={4} charts={0} />;
  if (!data) return null;

  return (
    <div className={cn("flex flex-col gap-5 transition-opacity", loading && "opacity-60")}>
      <StatGrid className="xl:grid-cols-5">
        <StatTile label="Money in" value={formatMoney(data.totals.moneyIn)} hint="Counted revenue" />
        <StatTile label="Money out" value={formatMoney(data.totals.moneyOut)} upIs="bad" hint="Refunds + cash outs" />
        <StatTile label="Net" value={formatMoney(data.totals.net)} emphasis />
        <StatTile label="Transactions" value={formatNumber(data.totals.transactions)} />
        <StatTile
          label="Online payments with a reference"
          value={`${data.online.withReference}/${data.online.count}`}
          upIs="neutral"
          hint={data.online.missingReference ? `${data.online.missingReference} missing a gateway reference` : "All matched"}
        />
      </StatGrid>

      <FlagSummary
        counts={data.flagCounts}
        active={flaggedOnly}
        onToggle={() => setParams({ flagged: flaggedOnly ? undefined : "1", page: undefined })}
      />

      <Card className="gap-3 shadow-none">
        <CardHeader className="flex flex-col gap-3 space-y-0 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-sm font-semibold">
            Transactions <span className="ml-1 font-normal text-muted-foreground">{formatNumber(data.transactions.total)}</span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onValueChange={(v) => setParams({ type: v === "ALL" ? undefined : v, page: undefined })}>
              <SelectTrigger className="h-8 w-[140px] text-xs" aria-label="Kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All kinds</SelectItem>
                <SelectItem value="PAYMENT">Payments</SelectItem>
                <SelectItem value="REFUND">Refunds</SelectItem>
                <SelectItem value="CASHOUT">Cash outs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={method} onValueChange={(v) => setParams({ method: v === "ALL" ? undefined : v, page: undefined })}>
              <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All methods</SelectItem>
                {Object.entries(METHOD_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search" className="h-8 pl-8 text-xs" />
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportAll} disabled={exporting}>
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={ledgerColumns}
            rows={data.transactions.rows}
            rowKey={(r) => `${r.kind}-${r.id}`}
            rowClassName={(r) => (r.flags.length ? "bg-amber-500/5" : undefined)}
            serverPaging={{
              page: data.transactions.page,
              totalPages: data.transactions.totalPages,
              total: data.transactions.total,
              pageSize: data.transactions.limit,
              onPageChange: (next) => setParams({ page: String(next) }),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FlagSummary({
  counts,
  active,
  onToggle,
}: {
  counts: Record<string, number>;
  active: boolean;
  onToggle: () => void;
}) {
  const entries = Object.entries(counts);
  if (!entries.length) {
    return <p className="text-xs text-muted-foreground">No unusual transactions were found in this period.</p>;
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
        <span className="font-medium">Worth checking:</span>
        {entries.map(([key, count]) => (
          <Badge key={key} variant="outline" className="text-[11px] font-normal">
            {flagLabel(key)} · {count}
          </Badge>
        ))}
      </div>
      <Button variant={active ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={onToggle} aria-pressed={active}>
        {active ? "Show all" : "Show flagged only"}
      </Button>
    </div>
  );
}

const ledgerColumns: DataColumn<LedgerRow>[] = [
  { key: "time", header: "Date", cell: (r) => <span className="whitespace-nowrap">{formatDateTime(r.time)}</span> },
  {
    key: "customer",
    header: "Who",
    cell: (r) => (
      <div className="min-w-[130px]">
        <p className="font-medium">{r.customer}</p>
        <p className="text-[11px] text-muted-foreground">{r.kind === "PAYMENT" ? r.phone : r.recordedBy && `Recorded by ${r.recordedBy}`}</p>
      </div>
    ),
  },
  {
    key: "item",
    header: "What",
    cell: (r) => (
      <div className="min-w-[140px]">
        <p>{r.item}</p>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {r.kind !== "PAYMENT" && <Badge variant="secondary" className="text-[10px]">{segmentLabel(r.kind)}</Badge>}
          {!r.countsAsRevenue && r.kind === "PAYMENT" && <Badge variant="outline" className="text-[10px]">Not revenue</Badge>}
          {r.isRefunded && <Badge variant="outline" className="text-[10px]">Refunded</Badge>}
          {r.flags.map((f) => (
            <Badge key={f} variant="outline" className="gap-1 border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              {flagLabel(f)}
            </Badge>
          ))}
        </div>
      </div>
    ),
  },
  { key: "method", header: "Method", cell: (r) => methodLabel(r.method) },
  { key: "branch", header: "Branch", cell: (r) => r.branch },
  { key: "reference", header: "Reference", cell: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.reference || "—"}</span> },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (r) => (
      <span className={cn("font-medium whitespace-nowrap", r.amount < 0 && "text-destructive")}>{formatMoney(r.amount)}</span>
    ),
  },
];

function CashTab() {
  const { data, loading, error, reload } = useFinanceData(financeApi.ledger, { limit: 1 });
  const { startDate, endDate } = useFinanceFilters();
  if (error) return <FinanceError message={error} onRetry={reload} />;
  if (loading && !data) return <FinanceLoading tiles={3} charts={0} />;
  if (!data) return null;
  return <CashBody data={data} onExport={() =>
    downloadCsv(`cash-check-${startDate}-to-${endDate}`, data.cashByDay, [
      { header: "Day", value: (r) => r.day },
      { header: "Branch", value: (r) => r.branch },
      { header: "Cash in (EGP)", value: (r) => r.cashIn },
      { header: "Refunds paid (EGP)", value: (r) => r.refundsOut },
      { header: "Cash outs (EGP)", value: (r) => r.cashOuts },
      { header: "Expected in drawer (EGP)", value: (r) => r.expectedInDrawer },
    ])
  } />;
}

function CashBody({ data, onExport }: { data: LedgerData; onExport: () => void }) {
  const totals = data.cashByDay.reduce(
    (acc, r) => ({ in: acc.in + r.cashIn, out: acc.out + r.refundsOut + r.cashOuts, net: acc.net + r.expectedInDrawer }),
    { in: 0, out: 0, net: 0 },
  );
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Cash taken" value={formatMoney(totals.in)} />
        <StatTile label="Cash paid out" value={formatMoney(totals.out)} upIs="bad" hint="Refunds + cash outs" />
        <StatTile label="Expected cash in drawers" value={formatMoney(totals.net)} emphasis />
      </div>
      <Card className="gap-3 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">Daily cash per branch</CardTitle>
            <CardDescription className="text-xs">
              Compare “expected in drawer” with the counted cash at close. Refunds are recorded as paid in cash.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onExport}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={data.cashByDay}
            rowKey={(r) => `${r.day}-${r.branchId}`}
            pageSize={20}
            initialSort={{ key: "day", dir: "desc" }}
            columns={[
              { key: "day", header: "Day", sortValue: (r) => r.day, cell: (r) => formatBucket(r.day, true) },
              { key: "branch", header: "Branch", sortValue: (r) => r.branch, cell: (r) => r.branch },
              { key: "in", header: "Cash in", align: "right", sortValue: (r) => r.cashIn, cell: (r) => formatMoney(r.cashIn) },
              { key: "refunds", header: "Refunds paid", align: "right", sortValue: (r) => r.refundsOut, cell: (r) => formatMoney(r.refundsOut) },
              { key: "cashouts", header: "Cash outs", align: "right", sortValue: (r) => r.cashOuts, cell: (r) => formatMoney(r.cashOuts) },
              {
                key: "expected",
                header: "Expected in drawer",
                align: "right",
                sortValue: (r) => r.expectedInDrawer,
                cell: (r) => <span className={cn("font-medium", r.expectedInDrawer < 0 && "text-destructive")}>{formatMoney(r.expectedInDrawer)}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function RefundsTab() {
  const { data, loading, error, reload } = useFinanceData(financeApi.refunds);
  if (error) return <FinanceError message={error} onRetry={reload} />;
  if (loading && !data) return <FinanceLoading tiles={4} />;
  if (!data) return null;
  return <RefundsBody data={data} />;
}

function RefundsBody({ data }: { data: RefundsData }) {
  const t = data.totals;
  const exportCsv = () =>
    downloadCsv(`refunds-${data.range.startDate}-to-${data.range.endDate}`, data.rows, [
      { header: "Date", value: (r) => formatDateTime(r.time) },
      { header: "Type", value: (r) => (r.type === "REFUND" ? "Refund" : "Cash out") },
      { header: "Amount (EGP)", value: (r) => r.amount },
      { header: "Reason", value: (r) => r.reason },
      { header: "Member", value: (r) => r.member },
      { header: "Branch", value: (r) => r.branch },
      { header: "Recorded by", value: (r) => r.recordedBy },
      { header: "Original payment", value: (r) => r.linkedPayment?.item ?? "" },
      { header: "Original amount (EGP)", value: (r) => r.linkedPayment?.amount ?? "" },
      { header: "Original date", value: (r) => (r.linkedPayment ? formatDate(r.linkedPayment.time) : "") },
    ]);

  return (
    <div className="flex flex-col gap-5">
      <StatGrid>
        <StatTile label="Refunded" value={formatMoney(t.refunds)} upIs="bad" hint={`${t.refundCount} refunds · avg ${formatMoney(t.avgRefund)}`} emphasis />
        <StatTile label="Refund rate" value={formatPercent(t.refundRate)} upIs="bad" hint={`of ${formatMoney(t.gross)} gross`} />
        <StatTile label="Cash outs" value={formatMoney(t.cashOuts)} upIs="bad" hint={`${t.cashOutCount} cash outs`} />
        <StatTile label="Total paid out" value={formatMoney(t.refunds + t.cashOuts)} upIs="bad" />
      </StatGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Money out over time"
          table={{
            rows: data.trend,
            columns: [
              { key: "bucket", header: "Period", cell: (r) => formatBucket(r.bucket, true) },
              { key: "refunds", header: "Refunds", align: "right", cell: (r) => formatMoney(r.refunds) },
              { key: "cashouts", header: "Cash outs", align: "right", cell: (r) => formatMoney(r.cashOuts) },
            ],
          }}
        >
          <ColumnChart
            data={data.trend}
            format={formatMoney}
            series={[
              { key: "refunds", label: "Refunds", color: "var(--viz-8)" },
              { key: "cashOuts", label: "Cash outs", color: "var(--viz-4)" },
            ]}
          />
        </ChartCard>
        <ChartCard
          title="Top reasons"
          table={{
            rows: data.byReason,
            columns: [
              { key: "reason", header: "Reason", cell: (r) => r.reason },
              { key: "type", header: "Type", cell: (r) => segmentLabel(r.type) },
              { key: "count", header: "Count", align: "right", cell: (r) => formatNumber(r.count) },
              { key: "amount", header: "Amount", align: "right", cell: (r) => formatMoney(r.amount) },
            ],
          }}
        >
          <BarList
            format={formatMoney}
            items={data.byReason.map((r) => ({
              key: `${r.type}-${r.reason}`,
              label: (
                <>
                  {r.reason} <span className="font-normal text-muted-foreground">· {segmentLabel(r.type)}</span>
                </>
              ),
              value: r.amount,
              color: r.type === "REFUND" ? "var(--viz-8)" : "var(--viz-4)",
              secondary: `×${r.count}`,
            }))}
            emptyText="No refunds or cash outs in this period."
          />
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="gap-3 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">By branch</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={data.byBranch}
              dense
              rowKey={(r) => r.branch}
              columns={[
                { key: "branch", header: "Branch", cell: (r) => r.branch },
                { key: "count", header: "Entries", align: "right", cell: (r) => formatNumber(r.count) },
                { key: "refunds", header: "Refunds", align: "right", cell: (r) => formatMoney(r.refunds) },
                { key: "cashouts", header: "Cash outs", align: "right", cell: (r) => formatMoney(r.cashOuts) },
              ]}
            />
          </CardContent>
        </Card>
        <Card className="gap-3 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recorded by</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={data.byStaff}
              dense
              rowKey={(r) => r.name}
              columns={[
                { key: "name", header: "Staff", cell: (r) => r.name },
                { key: "count", header: "Entries", align: "right", cell: (r) => formatNumber(r.count) },
                { key: "refunds", header: "Refunds", align: "right", cell: (r) => formatMoney(r.refunds) },
                { key: "cashouts", header: "Cash outs", align: "right", cell: (r) => formatMoney(r.cashOuts) },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold">
            All refunds & cash outs <span className="ml-1 font-normal text-muted-foreground">{formatNumber(data.rows.length)}</span>
          </CardTitle>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={data.rows}
            rowKey={(r) => r.id}
            pageSize={20}
            initialSort={{ key: "time", dir: "desc" }}
            columns={[
              { key: "time", header: "Date", sortValue: (r) => r.time, cell: (r) => <span className="whitespace-nowrap">{formatDateTime(r.time)}</span> },
              { key: "type", header: "Type", sortValue: (r) => r.type, cell: (r) => <Badge variant={r.type === "REFUND" ? "secondary" : "outline"}>{segmentLabel(r.type)}</Badge> },
              { key: "reason", header: "Reason", cell: (r) => r.reason },
              { key: "member", header: "Member", cell: (r) => r.member || "—" },
              {
                key: "original",
                header: "Original payment",
                cell: (r) =>
                  r.linkedPayment ? (
                    <div>
                      <p>{r.linkedPayment.item}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatMoney(r.linkedPayment.amount)} · {methodLabel(r.linkedPayment.method)} · {formatDate(r.linkedPayment.time)}
                      </p>
                    </div>
                  ) : (
                    "—"
                  ),
              },
              { key: "branch", header: "Branch", cell: (r) => r.branch },
              { key: "by", header: "Recorded by", sortValue: (r) => r.recordedBy, cell: (r) => r.recordedBy },
              { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, cell: (r) => <span className="font-medium">{formatMoney(r.amount)}</span> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
