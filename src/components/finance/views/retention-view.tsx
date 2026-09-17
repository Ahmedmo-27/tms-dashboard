"use client";

import { Download, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { financeApi, type RetentionData } from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { BarList, ColumnChart } from "../charts";
import { downloadCsv } from "../csv";
import { DataTable } from "../data-table";
import { FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatBucket, formatDate, formatMoney, formatNumber, formatPercent } from "../format";
import { categoryColor, segmentLabel } from "../labels";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData } from "../use-finance-data";

export function RetentionView() {
  const { data, loading, error, reload } = useFinanceData(financeApi.retention);

  const exportCsv = (d: RetentionData) =>
    downloadCsv(`retention-${d.range.startDate}-to-${d.range.endDate}`, d.churned, [
      { header: "Member", value: (r) => r.name },
      { header: "Phone", value: (r) => r.phone },
      { header: "Last package", value: (r) => r.packageName },
      { header: "Type", value: (r) => segmentLabel(r.category) },
      { header: "Ended", value: (r) => formatDate(r.endDate) },
    ]);

  return (
    <FinancePage
      title="Retention"
      description="Who is new, who renews, who left, and what members are worth over time."
      icon={Repeat}
      actions={
        <Button variant="outline" size="sm" className="h-10 gap-1.5" disabled={!data} onClick={() => data && exportCsv(data)}>
          <Download className="h-4 w-4" />
          Export not renewed
        </Button>
      }
    >
      {error ? (
        <FinanceError message={error} onRetry={reload} />
      ) : loading && !data ? (
        <FinanceLoading tiles={8} />
      ) : data ? (
        <RetentionBody data={data} />
      ) : null}
    </FinancePage>
  );
}

function RetentionBody({ data }: { data: RetentionData }) {
  const t = data.totals;
  return (
    <div className="flex flex-col gap-5">
      <StatGrid>
        <StatTile
          label="Renewal rate"
          value={formatPercent(t.renewalRate)}
          hint={`${t.packagesRenewed} of ${t.packagesEnded} packages that ended were followed by a new one within 30 days`}
          emphasis
          className="col-span-2"
        />
        <StatTile label="Active members now" value={formatNumber(t.activeMembers)} />
        <StatTile label="New app sign-ups" value={formatNumber(t.newSignups)} />
        <StatTile label="First-time package buyers" value={formatNumber(t.newPayingMembers)} hint={formatMoney(t.newRevenue)} />
        <StatTile label="Returning buyers" value={formatNumber(t.renewingMembers)} hint={formatMoney(t.renewalRevenue)} />
        <StatTile label="Average lifetime value" value={formatMoney(t.lifetimeValueAvg)} hint={`median ${formatMoney(t.lifetimeValueMedian)} · ${t.payingMembersAllTime} paying members`} />
        <StatTile
          label="Frozen right now"
          value={formatNumber(t.frozenPackages)}
          upIs="neutral"
          hint={`${formatMoney(t.frozenValue)} on hold · ${t.freezesStarted} freezes started (${t.freezeDays} days)`}
        />
      </StatGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="First-time vs returning buyers"
          description="Members buying a package in each period."
          table={{
            rows: data.trend,
            columns: [
              { key: "bucket", header: "Period", cell: (r) => formatBucket(r.bucket, true) },
              { key: "new", header: "First-time", align: "right", cell: (r) => formatNumber(r.newMembers) },
              { key: "renew", header: "Returning", align: "right", cell: (r) => formatNumber(r.renewingMembers) },
            ],
          }}
        >
          <ColumnChart
            data={data.trend}
            format={(v) => `${formatNumber(v)} members`}
            series={[
              { key: "newMembers", label: "First-time", color: "var(--viz-1)" },
              { key: "renewingMembers", label: "Returning", color: "var(--viz-3)" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Renewal rate by package type"
          description="Packages that ended in this period."
          table={{
            rows: data.byCategory,
            columns: [
              { key: "category", header: "Type", cell: (r) => segmentLabel(r.category) },
              { key: "ended", header: "Ended", align: "right", cell: (r) => formatNumber(r.ended) },
              { key: "renewed", header: "Renewed", align: "right", cell: (r) => formatNumber(r.renewed) },
              { key: "rate", header: "Rate", align: "right", cell: (r) => formatPercent(r.renewalRate), sortValue: (r) => r.renewalRate },
            ],
          }}
        >
          <BarList
            format={(v) => formatPercent(v)}
            max={100}
            items={data.byCategory.map((c) => ({
              key: c.category,
              label: segmentLabel(c.category),
              value: c.renewalRate ?? 0,
              color: categoryColor(c.category),
              secondary: `${c.renewed}/${c.ended}`,
            }))}
            emptyText="No packages ended in this period."
          />
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="gap-3 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top spenders</CardTitle>
            <CardDescription className="text-xs">Most paid in this period, with their all-time total.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={data.topSpenders}
              rowKey={(r) => r.memberId}
              dense
              columns={[
                {
                  key: "name",
                  header: "Member",
                  cell: (r) => (
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.phone}</p>
                    </div>
                  ),
                },
                { key: "payments", header: "Payments", align: "right", cell: (r) => formatNumber(r.payments) },
                { key: "total", header: "This period", align: "right", cell: (r) => <span className="font-medium">{formatMoney(r.total)}</span> },
                { key: "ltv", header: "All time", align: "right", cell: (r) => formatMoney(r.lifetimeValue) },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="gap-3 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Not renewed</CardTitle>
            <CardDescription className="text-xs">
              Packages that ended in this period with no new package within 30 days (most recent first).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={data.churned}
              rowKey={(r, i) => `${r.memberId}-${i}`}
              dense
              emptyText="Everyone renewed."
              columns={[
                {
                  key: "name",
                  header: "Member",
                  sortValue: (r) => r.name,
                  cell: (r) => (
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.phone}</p>
                    </div>
                  ),
                },
                { key: "package", header: "Last package", sortValue: (r) => r.packageName, cell: (r) => r.packageName },
                { key: "ended", header: "Ended", sortValue: (r) => r.endDate, cell: (r) => formatDate(r.endDate) },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
