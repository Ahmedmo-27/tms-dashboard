"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Download, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { financeApi, type PtData } from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { ColumnChart } from "../charts";
import { downloadCsv } from "../csv";
import { DataTable } from "../data-table";
import { FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatBucket, formatDate, formatMoney, formatNumber, formatPercent } from "../format";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData, useFinanceHref } from "../use-finance-data";

export function PtView() {
  const { data, loading, error, reload, startDate, endDate } = useFinanceData(financeApi.pt);

  const exportCsv = (d: PtData) =>
    downloadCsv(`pt-analytics-${startDate}-to-${endDate}`, d.coaches, [
      { header: "Coach", value: (r) => r.name },
      { header: "Sessions", value: (r) => r.sessions },
      { header: "Check-in sessions", value: (r) => r.scanSessions },
      { header: "Coach-deducted sessions", value: (r) => r.deductionSessions },
      { header: "Active clients", value: (r) => r.activeClients },
      { header: "Sessions left", value: (r) => r.remainingSessions },
      { header: "Low balance clients", value: (r) => r.lowBalanceClients },
      { header: "Expiring in 7 days", value: (r) => r.expiringSoon },
      { header: "Packages sold", value: (r) => r.sales },
      { header: "New clients", value: (r) => r.newSales },
      { header: "Renewals", value: (r) => r.renewals },
      { header: "Revenue (EGP)", value: (r) => r.revenue },
    ]);

  return (
    <FinancePage
      title="PT Analytics"
      description="Personal training sessions, client balances, sales and renewals by coach."
      icon={Dumbbell}
      actions={
        <Button variant="outline" size="sm" className="h-10 gap-1.5" disabled={!data} onClick={() => data && exportCsv(data)}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      }
    >
      {error ? (
        <FinanceError message={error} onRetry={reload} />
      ) : loading && !data ? (
        <FinanceLoading tiles={8} />
      ) : data ? (
        <PtBody data={data} />
      ) : null}
    </FinancePage>
  );
}

function PtBody({ data }: { data: PtData }) {
  const href = useFinanceHref();
  const t = data.totals;
  return (
    <div className="flex flex-col gap-5">
      <StatGrid>
        <StatTile label="PT sessions delivered" value={formatNumber(t.sessions)} hint={`${t.scanSessions} check-ins · ${t.deductionSessions} coach deductions`} emphasis className="col-span-2" />
        <StatTile label="PT revenue" value={formatMoney(t.revenue)} hint={`${t.sales} packages sold`} />
        <StatTile label="Renewals" value={formatNumber(t.renewals)} hint={`${formatPercent(t.renewalShare)} of sales · ${t.newSales} new`} />
        <StatTile label="Active PT clients" value={formatNumber(t.activeClients)} hint={`${t.activePackages} live packages`} />
        <StatTile label="Sessions still owed" value={formatNumber(t.remainingSessions)} hint={`worth ${formatMoney(t.remainingValue)}`} />
        <StatTile label="Low balance" value={formatNumber(t.lowBalance)} upIs="neutral" hint="2 sessions or fewer" />
        <StatTile label="Expiring in 7 days" value={formatNumber(t.expiringSoon)} upIs="neutral" />
      </StatGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="PT sessions over time"
          table={{
            rows: data.trend,
            columns: [
              { key: "bucket", header: "Period", cell: (r) => formatBucket(r.bucket, true) },
              { key: "sessions", header: "Sessions", align: "right", cell: (r) => formatNumber(r.sessions) },
            ],
          }}
        >
          <ColumnChart data={data.trend} series={[{ key: "sessions", label: "Sessions", color: "var(--viz-3)" }]} format={(v) => `${formatNumber(v)} sessions`} />
        </ChartCard>
        <ChartCard
          title="PT revenue over time"
          table={{
            rows: data.trend,
            columns: [
              { key: "bucket", header: "Period", cell: (r) => formatBucket(r.bucket, true) },
              { key: "revenue", header: "Revenue", align: "right", cell: (r) => formatMoney(r.revenue) },
            ],
          }}
        >
          <ColumnChart data={data.trend} series={[{ key: "revenue", label: "Revenue", color: "var(--viz-1)" }]} format={formatMoney} />
        </ChartCard>
      </div>

      <Card className="gap-3 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">PT coaches</CardTitle>
          <CardDescription className="text-xs">
            Coaches are linked through the coach on each PT package. Select a coach for every session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={data.coaches}
            rowKey={(r) => r.coachId}
            initialSort={{ key: "sessions", dir: "desc" }}
            columns={[
              {
                key: "name",
                header: "Coach",
                sortValue: (r) => r.name,
                cell: (r) =>
                  r.coachId === "unassigned" ? (
                    <span className="text-muted-foreground">{r.name}</span>
                  ) : (
                    <Link href={href("/dashboard/finance/coach-packages", { coachId: r.coachId })} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                  ),
              },
              { key: "sessions", header: "Sessions", align: "right", sortValue: (r) => r.sessions, cell: (r) => formatNumber(r.sessions) },
              { key: "clients", header: "Active clients", align: "right", sortValue: (r) => r.activeClients, cell: (r) => formatNumber(r.activeClients) },
              { key: "avg", header: "Sessions / client", align: "right", sortValue: (r) => r.avgSessionsPerClient, cell: (r) => formatNumber(r.avgSessionsPerClient) },
              { key: "left", header: "Sessions left", align: "right", sortValue: (r) => r.remainingSessions, cell: (r) => formatNumber(r.remainingSessions) },
              { key: "sales", header: "Sold (new / renew)", align: "right", sortValue: (r) => r.sales, cell: (r) => `${r.sales} (${r.newSales} / ${r.renewals})` },
              { key: "revenue", header: "Revenue", align: "right", sortValue: (r) => r.revenue, cell: (r) => <span className="font-medium">{formatMoney(r.revenue)}</span> },
              {
                key: "alerts",
                header: "Needs attention",
                sortValue: (r) => r.lowBalanceClients + r.expiringSoon,
                cell: (r) =>
                  r.lowBalanceClients + r.expiringSoon ? (
                    <span className="text-xs">
                      {r.lowBalanceClients > 0 && `${r.lowBalanceClients} low`}
                      {r.lowBalanceClients > 0 && r.expiringSoon > 0 && " · "}
                      {r.expiringSoon > 0 && `${r.expiringSoon} expiring`}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="gap-3 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Clients to follow up</CardTitle>
          <CardDescription className="text-xs">
            Live PT packages with 2 sessions or fewer left, or ending within 7 days — likely renewals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={data.alerts}
            rowKey={(r, i) => `${r.memberId}-${r.packageName}-${i}`}
            emptyText="No PT clients need attention right now."
            columns={[
              {
                key: "member",
                header: "Client",
                sortValue: (r) => r.memberName,
                cell: (r) => (
                  <div>
                    <p className="font-medium">{r.memberName}</p>
                    <p className="text-[11px] text-muted-foreground">{r.phone}</p>
                  </div>
                ),
              },
              { key: "coach", header: "Coach", sortValue: (r) => r.coach, cell: (r) => r.coach },
              { key: "package", header: "Package", cell: (r) => r.packageName },
              { key: "left", header: "Sessions left", align: "right", sortValue: (r) => r.remainingSessions, cell: (r) => formatNumber(r.remainingSessions) },
              { key: "end", header: "Ends", sortValue: (r) => r.endDate, cell: (r) => formatDate(r.endDate) },
              {
                key: "why",
                header: "Why",
                cell: (r) => (
                  <div className="flex flex-wrap gap-1">
                    {r.reasons.includes("LOW_BALANCE") && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <AlertTriangle className="h-3 w-3" /> Low balance
                      </Badge>
                    )}
                    {r.reasons.includes("EXPIRING_SOON") && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Clock className="h-3 w-3" /> Expiring
                      </Badge>
                    )}
                    {r.status === "FROZEN" && <Badge variant="secondary" className="text-[10px]">Frozen</Badge>}
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
