"use client";

import { Building2, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { financeApi, type BranchesData, type BranchRow } from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { TrendChart, Sparkline, type Series } from "../charts";
import { downloadCsv } from "../csv";
import { DataTable } from "../data-table";
import { FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatBucket, formatMoney, formatNumber, formatPercent, formatRangeLabel } from "../format";
import { seriesColor } from "../labels";
import { StatTile } from "../stat-tile";
import { useFinanceData } from "../use-finance-data";

export function BranchesView() {
  // Comparison always spans every branch, so the branch filter is not sent.
  const { data, loading, error, reload } = useFinanceData((p) => financeApi.branches({ ...p, locationId: undefined }));

  const exportCsv = (d: BranchesData) =>
    downloadCsv(`branches-${d.range.startDate}-to-${d.range.endDate}`, d.branches, [
      { header: "Branch", value: (r) => r.branchName },
      { header: "Gross (EGP)", value: (r) => r.gross },
      { header: "Refunds (EGP)", value: (r) => r.refunds },
      { header: "Net (EGP)", value: (r) => r.net },
      { header: "Previous net (EGP)", value: (r) => r.previousNet },
      { header: "Net change %", value: (r) => r.netChange ?? "" },
      { header: "Cash outs (EGP)", value: (r) => r.cashOuts },
      { header: "Transactions", value: (r) => r.transactions },
      { header: "Average payment (EGP)", value: (r) => r.avgTicket },
      { header: "Refund rate %", value: (r) => r.refundRate },
      { header: "Cash %", value: (r) => r.cashShare },
      { header: "Card & online %", value: (r) => r.cardShare },
      { header: "InstaPay %", value: (r) => r.instapayShare },
      { header: "Active members", value: (r) => r.activeMembers },
      { header: "Net per active member (EGP)", value: (r) => r.revenuePerMember ?? "" },
      { header: "Classes", value: (r) => r.classSessions },
      { header: "Class attendance", value: (r) => r.classAttendance },
    ]);

  return (
    <FinancePage
      title="Branches"
      description="Every branch side by side for the same period."
      icon={Building2}
      actions={
        <Button variant="outline" size="sm" className="h-10 gap-1.5" disabled={!data} onClick={() => data && exportCsv(data)}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      }
      note={
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          This page always compares all branches; the branch selector does not apply here.
        </p>
      }
    >
      {error ? (
        <FinanceError message={error} onRetry={reload} />
      ) : loading && !data ? (
        <FinanceLoading tiles={3} charts={1} />
      ) : data ? (
        <BranchesBody data={data} />
      ) : null}
    </FinancePage>
  );
}

function BranchesBody({ data }: { data: BranchesData }) {
  const branches = data.branches;
  const leader = branches[0];
  const totalNet = branches.reduce((s, b) => s + b.net, 0);
  const trendSeries: Series[] = branches.slice(0, 8).map((b, i) => ({
    key: b.locationId,
    label: b.branchName,
    color: seriesColor(i),
    kind: "line",
  }));
  const buckets = leader?.trend.map((t) => t.bucket) ?? [];
  const trendRows = buckets.map((bucket, i) => ({
    bucket,
    ...Object.fromEntries(branches.map((b) => [b.locationId, b.trend[i]?.net ?? 0])),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Net revenue, all branches" value={formatMoney(totalNet)} emphasis />
        <StatTile
          label="Top branch"
          value={leader ? leader.branchName : "—"}
          hint={leader ? `${formatMoney(leader.net)} · ${totalNet ? formatPercent((leader.net / totalNet) * 100) : "—"} of net` : undefined}
        />
        <StatTile
          label="Members on all-branch packages"
          value={formatNumber(data.allBranchMembers)}
          hint="Counted once, not per branch"
        />
      </div>

      <Card className="gap-3 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Comparison</CardTitle>
          <CardDescription className="text-xs">
            Change is against {formatRangeLabel(data.previousRange.startDate, data.previousRange.endDate)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<BranchRow>
            rows={branches}
            rowKey={(r) => r.locationId}
            initialSort={{ key: "net", dir: "desc" }}
            columns={[
              { key: "name", header: "Branch", sortValue: (r) => r.branchName, cell: (r) => <span className="font-medium">{r.branchName}</span> },
              { key: "net", header: "Net", align: "right", sortValue: (r) => r.net, cell: (r) => <span className="font-medium">{formatMoney(r.net)}</span> },
              {
                key: "change",
                header: "Change",
                align: "right",
                sortValue: (r) => r.netChange,
                cell: (r) =>
                  r.netChange === null ? (
                    "—"
                  ) : (
                    <span style={{ color: r.netChange >= 0 ? "var(--viz-good)" : "var(--viz-bad)" }}>
                      {r.netChange >= 0 ? "▲ +" : "▼ "}
                      {formatPercent(r.netChange)}
                    </span>
                  ),
              },
              { key: "trend", header: "Trend", cell: (r) => <Sparkline values={r.trend.map((t) => t.net)} /> },
              { key: "gross", header: "Gross", align: "right", sortValue: (r) => r.gross, cell: (r) => formatMoney(r.gross) },
              { key: "refundRate", header: "Refund rate", align: "right", sortValue: (r) => r.refundRate, cell: (r) => formatPercent(r.refundRate) },
              { key: "cashouts", header: "Cash outs", align: "right", sortValue: (r) => r.cashOuts, cell: (r) => formatMoney(r.cashOuts) },
              { key: "avg", header: "Avg payment", align: "right", sortValue: (r) => r.avgTicket, cell: (r) => formatMoney(r.avgTicket) },
              {
                key: "mix",
                header: "Cash / card / InstaPay",
                align: "right",
                cell: (r) => `${formatPercent(r.cashShare, 0)} / ${formatPercent(r.cardShare, 0)} / ${formatPercent(r.instapayShare, 0)}`,
              },
              { key: "members", header: "Active members", align: "right", sortValue: (r) => r.activeMembers, cell: (r) => formatNumber(r.activeMembers) },
              { key: "rpm", header: "Net / member", align: "right", sortValue: (r) => r.revenuePerMember, cell: (r) => formatMoney(r.revenuePerMember) },
              {
                key: "classes",
                header: "Classes (attended)",
                align: "right",
                sortValue: (r) => r.classSessions,
                cell: (r) => `${formatNumber(r.classSessions)} (${formatNumber(r.classAttendance)})`,
              },
            ]}
          />
          {data.unassignedRefunds > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatMoney(data.unassignedRefunds)} in refunds or cash outs have no branch and are not in this table.
            </p>
          )}
        </CardContent>
      </Card>

      <ChartCard
        title="Net revenue by branch over time"
        table={{
          rows: trendRows,
          columns: [
            { key: "bucket", header: "Period", cell: (r) => formatBucket(r.bucket, true) },
            ...branches.map((b) => ({
              key: b.locationId,
              header: b.branchName,
              align: "right" as const,
              cell: (r: (typeof trendRows)[number]) => formatMoney(Number((r as Record<string, unknown>)[b.locationId] ?? 0)),
            })),
          ],
        }}
      >
        <TrendChart data={trendRows} series={trendSeries} format={formatMoney} height={280} />
      </ChartCard>
    </div>
  );
}
