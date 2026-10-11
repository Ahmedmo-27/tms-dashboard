"use client";

import Link from "next/link";
import { Download, FileText, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { financeApi, type OverviewData } from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { BarList, ShareBar, TrendChart } from "../charts";
import { downloadCsv } from "../csv";
import { EmptyState, FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import {
  formatBucket,
  formatCompactMoney,
  formatMoney,
  formatNumber,
  formatRangeLabel,
} from "../format";
import { methodLabel, segmentLabel } from "../labels";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData, useFinanceHref } from "../use-finance-data";

const METHOD_ORDER = ["CASH", "VISA", "INSTAPAY", "APP", "PAYMENT_LINK", "VALU"];

export function OverviewView() {
  const { data, loading, error, reload, startDate, endDate } = useFinanceData(financeApi.overview);

  const exportTrend = (d: OverviewData) =>
    downloadCsv(`finance-overview-${startDate}-to-${endDate}`, d.trend, [
      { header: "Period", value: (r) => r.bucket },
      { header: "Gross revenue (EGP)", value: (r) => r.gross },
      { header: "Refunds (EGP)", value: (r) => r.refunds },
      { header: "Net revenue (EGP)", value: (r) => r.net },
      { header: "Previous period net (EGP)", value: (r) => r.previousNet ?? "" },
    ]);

  return (
    <FinancePage
      title="Finance Overview"
      description="Money in, money out and where it came from."
      icon={LayoutDashboard}
      actions={
        <>
          <Button variant="outline" size="sm" className="h-10 gap-1.5" disabled={!data} onClick={() => data && exportTrend(data)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button asChild size="sm" className="h-10 gap-1.5">
            <Link href={`/dashboard/finance/report?month=${endDate.slice(0, 7)}`}>
              <FileText className="h-4 w-4" />
              Monthly report
            </Link>
          </Button>
        </>
      }
    >
      {error ? (
        <FinanceError message={error} onRetry={reload} />
      ) : loading && !data ? (
        <FinanceLoading tiles={8} />
      ) : data ? (
        <OverviewBody data={data} />
      ) : null}
    </FinancePage>
  );
}

function OverviewBody({ data }: { data: OverviewData }) {
  const href = useFinanceHref();
  const { current, deltas } = data.summary;
  const prevLabel = `vs ${formatRangeLabel(data.previousRange.startDate, data.previousRange.endDate)}`;
  const methodParts = [...data.byMethod].sort(
    (a, b) => METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method),
  );

  return (
    <div className="flex flex-col gap-5">
      <StatGrid>
        <StatTile
          label="Net revenue"
          value={formatMoney(current.net)}
          delta={deltas.net}
          hint={prevLabel}
          emphasis
          className="col-span-2"
        />
        <StatTile label="Gross revenue" value={formatMoney(current.gross)} delta={deltas.gross} />
        <StatTile label="Refunds" value={formatMoney(current.refunds)} delta={deltas.refunds} upIs="bad" hint={`${current.refundCount} refunds`} />
        <StatTile label="Transactions" value={formatNumber(current.transactions)} delta={deltas.transactions} />
        <StatTile label="Average payment" value={formatMoney(current.avgTicket)} delta={deltas.avgTicket} />
        <StatTile label="Paying customers" value={formatNumber(current.payingCustomers)} delta={deltas.payingCustomers} />
        <StatTile
          label="Cash outs"
          value={formatMoney(current.cashOuts)}
          delta={deltas.cashOuts}
          upIs="bad"
          hint={`Net after cash outs ${formatCompactMoney(current.netCash)}`}
        />
      </StatGrid>

      {current.deductedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {current.deductedCount} payment{current.deductedCount === 1 ? " was" : "s were"} marked “deducted from a
          new package” and {current.deductedCount === 1 ? "is" : "are"} not counted again as revenue.
        </p>
      )}

      <ChartCard
        title="Net revenue over time"
        description="Payments minus refunds, compared with the previous period of the same length."
        table={{
          rows: data.trend,
          columns: [
            { key: "bucket", header: "Period", cell: (r) => formatBucket(r.bucket, true) },
            { key: "gross", header: "Gross", align: "right", cell: (r) => formatMoney(r.gross), sortValue: (r) => r.gross },
            { key: "refunds", header: "Refunds", align: "right", cell: (r) => formatMoney(r.refunds), sortValue: (r) => r.refunds },
            { key: "net", header: "Net", align: "right", cell: (r) => formatMoney(r.net), sortValue: (r) => r.net },
            { key: "prev", header: "Previous net", align: "right", cell: (r) => formatMoney(r.previousNet) },
          ],
        }}
      >
        <TrendChart
          data={data.trend}
          format={formatMoney}
          height={280}
          series={[
            { key: "net", label: "Net revenue", color: "var(--viz-1)", kind: "area" },
            { key: "previousNet", label: "Previous period", color: "var(--viz-muted)", kind: "line" },
          ]}
        />
      </ChartCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Revenue by type"
          description="Packages by category, plus drop-ins and walk-ins."
          table={{
            rows: data.bySegment,
            columns: [
              { key: "segment", header: "Type", cell: (r) => segmentLabel(r.segment) },
              { key: "count", header: "Payments", align: "right", cell: (r) => formatNumber(r.count), sortValue: (r) => r.count },
              { key: "amount", header: "Revenue", align: "right", cell: (r) => formatMoney(r.amount), sortValue: (r) => r.amount },
            ],
          }}
        >
          <BarList
            format={formatMoney}
            items={data.bySegment.map((s) => ({
              key: s.segment,
              label: (
                <Link href={href("/dashboard/finance/sales", { segment: s.segment })} className="hover:underline">
                  {segmentLabel(s.segment)}
                </Link>
              ),
              value: s.amount,
              secondary: `${s.count}`,
            }))}
          />
        </ChartCard>

        <div className="flex flex-col gap-5">
          <ChartCard
            title="How customers paid"
            description="Share of gross revenue by payment method."
            table={{
              rows: methodParts,
              columns: [
                { key: "method", header: "Method", cell: (r) => methodLabel(r.method) },
                { key: "count", header: "Payments", align: "right", cell: (r) => formatNumber(r.count) },
                { key: "amount", header: "Amount", align: "right", cell: (r) => formatMoney(r.amount) },
              ],
            }}
          >
            <ShareBar
              format={formatMoney}
              parts={methodParts.map((m) => ({
                key: m.method,
                label: methodLabel(m.method),
                value: m.amount,
                color: `var(--viz-${Math.max(0, METHOD_ORDER.indexOf(m.method)) + 1})`,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Revenue by branch"
            description="Net revenue per branch."
            table={{
              rows: data.byBranch,
              columns: [
                { key: "branch", header: "Branch", cell: (r) => r.branchName },
                { key: "gross", header: "Gross", align: "right", cell: (r) => formatMoney(r.gross) },
                { key: "refunds", header: "Refunds", align: "right", cell: (r) => formatMoney(r.refunds) },
                { key: "net", header: "Net", align: "right", cell: (r) => formatMoney(r.net) },
              ],
            }}
          >
            {data.byBranch.length ? (
              <BarList
                format={formatMoney}
                items={data.byBranch.map((b) => ({
                  key: b.locationId,
                  label: b.branchName,
                  value: b.net,
                  secondary: `${b.count} payments`,
                }))}
              />
            ) : (
              <EmptyState title="No payments in this period" />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
