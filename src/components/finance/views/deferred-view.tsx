"use client";

import { Download, Hourglass, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { financeApi, type DeferredData } from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { BarList, ColumnChart } from "../charts";
import { downloadCsv } from "../csv";
import { DataTable } from "../data-table";
import { FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatDate, formatDateTime, formatMoney, formatNumber } from "../format";
import { categoryColor, segmentLabel } from "../labels";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData } from "../use-finance-data";

export function DeferredView() {
  const { data, loading, error, reload } = useFinanceData(financeApi.deferred);

  const exportCsv = (d: DeferredData) =>
    downloadCsv(`deferred-revenue-${d.range.startDate}-to-${d.range.endDate}`, d.categories, [
      { header: "Category", value: (r) => segmentLabel(r.category) },
      { header: "Unearned today (EGP)", value: (r) => r.unearned },
      { header: "Sessions owed", value: (r) => r.sessionsOwed },
      { header: "Live packages", value: (r) => r.packages },
      { header: "Earned in period (EGP)", value: (r) => r.earned },
      { header: "Expired unused in period (EGP)", value: (r) => r.breakage },
      { header: "Expired packages with balance", value: (r) => r.expiredPackages },
    ]);

  return (
    <FinancePage
      title="Deferred Revenue"
      description="Money already collected for sessions and membership time not delivered yet."
      icon={Hourglass}
      actions={
        <Button variant="outline" size="sm" className="h-10 gap-1.5" disabled={!data} onClick={() => data && exportCsv(data)}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      }
      note={
        <p className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Unearned value is as of right now. The date range controls “earned”, “collected” and “expired unused”.
          Session packages are valued at list price ÷ sessions; unlimited memberships by the share of time left.
        </p>
      }
    >
      {error ? (
        <FinanceError message={error} onRetry={reload} />
      ) : loading && !data ? (
        <FinanceLoading tiles={6} />
      ) : data ? (
        <DeferredBody data={data} />
      ) : null}
    </FinancePage>
  );
}

function DeferredBody({ data }: { data: DeferredData }) {
  const t = data.totals;
  return (
    <div className="flex flex-col gap-5">
      <StatGrid>
        <StatTile
          label="Unearned revenue today"
          value={formatMoney(t.unearned)}
          hint={`${formatNumber(t.sessionsOwed)} sessions owed · ${t.livePackages} live packages · as of ${formatDateTime(data.asOf)}`}
          emphasis
          className="col-span-2"
        />
        <StatTile label="Earned in period" value={formatMoney(t.earnedInRange)} hint="Sessions used + membership time" />
        <StatTile label="Collected for packages" value={formatMoney(t.collectedInRange)} hint="Package payments in period" />
        <StatTile label="Expired unused" value={formatMoney(t.breakageInRange)} upIs="neutral" hint={`${t.expiredWithBalance} packages ended with sessions left`} />
        <StatTile label="At risk in next 30 days" value={formatMoney(t.expiringNext30Days)} upIs="neutral" hint="Unused sessions on packages ending soon" />
      </StatGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Unearned revenue by type"
          description="What we still owe members, in money."
          table={{
            rows: data.categories,
            columns: [
              { key: "category", header: "Type", cell: (r) => segmentLabel(r.category) },
              { key: "packages", header: "Live packages", align: "right", cell: (r) => formatNumber(r.packages) },
              { key: "sessions", header: "Sessions owed", align: "right", cell: (r) => formatNumber(r.sessionsOwed) },
              { key: "unearned", header: "Unearned", align: "right", cell: (r) => formatMoney(r.unearned), sortValue: (r) => r.unearned },
            ],
          }}
        >
          <BarList
            format={formatMoney}
            items={data.categories
              .filter((c) => c.unearned > 0)
              .map((c) => ({
                key: c.category,
                label: segmentLabel(c.category),
                value: c.unearned,
                color: categoryColor(c.category),
                secondary: c.sessionsOwed ? `${c.sessionsOwed} sessions` : "time-based",
              }))}
            emptyText="Nothing is owed right now."
          />
        </ChartCard>

        <ChartCard
          title="Earned vs expired unused"
          description="In the selected period, by type."
          table={{
            rows: data.categories,
            columns: [
              { key: "category", header: "Type", cell: (r) => segmentLabel(r.category) },
              { key: "earned", header: "Earned", align: "right", cell: (r) => formatMoney(r.earned), sortValue: (r) => r.earned },
              { key: "breakage", header: "Expired unused", align: "right", cell: (r) => formatMoney(r.breakage), sortValue: (r) => r.breakage },
            ],
          }}
        >
          <ColumnChart
            data={data.categories.map((c) => ({ label: segmentLabel(c.category), earned: c.earned, breakage: c.breakage }))}
            xKey="label"
            xFormatter={(v) => v}
            stacked={false}
            format={formatMoney}
            series={[
              { key: "earned", label: "Earned", color: "var(--viz-1)" },
              { key: "breakage", label: "Expired unused", color: "var(--viz-2)" },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Value expiring in the next weeks"
          description="Unused sessions on packages that end soon."
          table={{
            rows: data.expiringByWeek,
            columns: [
              { key: "week", header: "Week", cell: (r) => r.week },
              { key: "value", header: "Value", align: "right", cell: (r) => formatMoney(r.value) },
            ],
          }}
        >
          <ColumnChart
            data={data.expiringByWeek}
            xKey="week"
            xFormatter={(v) => v}
            format={formatMoney}
            series={[{ key: "value", label: "Value at risk", color: "var(--viz-2)" }]}
            height={220}
          />
        </ChartCard>
        <ChartCard
          title="Unearned by branch"
          table={{
            rows: data.byBranch,
            columns: [
              { key: "branch", header: "Branch", cell: (r) => r.branchName },
              { key: "sessions", header: "Sessions owed", align: "right", cell: (r) => formatNumber(r.sessionsOwed) },
              { key: "unearned", header: "Unearned", align: "right", cell: (r) => formatMoney(r.unearned) },
            ],
          }}
        >
          <BarList
            format={formatMoney}
            items={data.byBranch.map((b) => ({
              key: b.locationId || "none",
              label: b.branchName,
              value: b.unearned,
              secondary: `${b.sessionsOwed} sessions`,
            }))}
          />
        </ChartCard>
      </div>

      <Card className="gap-3 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Packages ending in the next 30 days with sessions left</CardTitle>
          <CardDescription className="text-xs">Good candidates for a reminder before the value is lost.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={data.expiring}
            rowKey={(r, i) => `${r.memberId}-${r.packageName}-${i}`}
            initialSort={{ key: "end", dir: "asc" }}
            emptyText="No packages with unused sessions end in the next 30 days."
            columns={[
              { key: "member", header: "Member", sortValue: (r) => r.memberName, cell: (r) => <span className="font-medium">{r.memberName}</span> },
              { key: "package", header: "Package", sortValue: (r) => r.packageName, cell: (r) => r.packageName },
              { key: "type", header: "Type", cell: (r) => segmentLabel(r.category) },
              { key: "left", header: "Sessions left", align: "right", sortValue: (r) => r.remainingSessions, cell: (r) => formatNumber(r.remainingSessions) },
              { key: "value", header: "Value at risk", align: "right", sortValue: (r) => r.valueAtRisk, cell: (r) => formatMoney(r.valueAtRisk) },
              { key: "end", header: "Ends", sortValue: (r) => r.endDate, cell: (r) => formatDate(r.endDate) },
              { key: "branch", header: "Branch", cell: (r) => r.branch },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
