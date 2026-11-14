"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { financeApi, type CoachHoursClassRow, type CoachHoursData, type CoachHoursRow } from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { ColumnChart, type Series } from "../charts";
import { downloadCsv } from "../csv";
import { DataTable, type DataColumn } from "../data-table";
import { FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatBucket, formatMoney, formatNumber, formatPercent } from "../format";
import { categoryColor, segmentLabel } from "../labels";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData, useFinanceHref } from "../use-finance-data";

const hoursFormat = (v: number) => `${formatNumber(v)} h`;

export function CoachHoursView() {
  const { data, loading, error, reload, startDate, endDate } = useFinanceData(financeApi.coachHours);

  const exportCsv = (d: CoachHoursData) => {
    const categories = d.categories.map((c) => c.category);
    downloadCsv(`coach-hours-${startDate}-to-${endDate}`, d.coaches, [
      { header: "Coach", value: (r) => r.name },
      { header: "Class sessions", value: (r) => r.sessions },
      { header: "Class hours", value: (r) => r.hours },
      ...categories.map((c) => ({ header: `${segmentLabel(c)} hours`, value: (r: CoachHoursRow) => r.hoursByCategory[c] ?? 0 })),
      { header: "PT sessions", value: (r) => r.ptSessions },
      { header: "Booked", value: (r) => r.booked },
      { header: "Attended", value: (r) => r.attended },
      { header: "Attendance %", value: (r) => r.attendanceRate ?? "" },
      { header: "Fill %", value: (r) => r.fillRate ?? "" },
      { header: "Package uses (booked)", value: (r) => r.packageUses },
      { header: "Package uses (attended)", value: (r) => r.attendedPackageUses },
      { header: "Drop-ins", value: (r) => r.dropIns },
      { header: "Drop-in revenue (EGP)", value: (r) => r.dropInRevenue },
      { header: "Package session value (EGP)", value: (r) => r.packageValue },
      { header: "PT package revenue (EGP)", value: (r) => r.ptRevenue },
      { header: "Attributed revenue (EGP)", value: (r) => r.attributedRevenue },
    ]);
  };

  return (
    <FinancePage
      title="Coach Hours"
      description="How much each coach taught, in which kind of session, and what it brought in."
      icon={Timer}
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
        <FinanceLoading tiles={5} />
      ) : data ? (
        <CoachHoursBody data={data} />
      ) : null}
    </FinancePage>
  );
}

function CoachHoursBody({ data }: { data: CoachHoursData }) {
  const href = useFinanceHref();
  const t = data.totals;
  const categorySeries: Series[] = data.categories.map((c) => ({
    key: c.category,
    label: segmentLabel(c.category),
    color: categoryColor(c.category),
  }));

  const perCoach = data.coaches
    .filter((c) => c.hours > 0)
    .map((c) => ({ name: c.name, ...c.hoursByCategory }));

  const columns: DataColumn<CoachHoursRow>[] = [
    {
      key: "name",
      header: "Coach",
      sortValue: (r) => r.name,
      cell: (r) => (
        <Link
          href={href("/dashboard/finance/coach-packages", { coachId: r.coachId })}
          className="font-medium hover:underline"
        >
          {r.name}
        </Link>
      ),
    },
    { key: "hours", header: "Class hours", align: "right", sortValue: (r) => r.hours, cell: (r) => hoursFormat(r.hours) },
    { key: "sessions", header: "Classes", align: "right", sortValue: (r) => r.sessions, cell: (r) => formatNumber(r.sessions) },
    { key: "pt", header: "PT sessions", align: "right", sortValue: (r) => r.ptSessions, cell: (r) => formatNumber(r.ptSessions) },
    {
      key: "attended",
      header: "Attended / booked",
      align: "right",
      sortValue: (r) => r.attended,
      cell: (r) => `${formatNumber(r.attended)} / ${formatNumber(r.booked)}`,
    },
    { key: "attendance", header: "Show-up", align: "right", sortValue: (r) => r.attendanceRate, cell: (r) => formatPercent(r.attendanceRate) },
    { key: "fill", header: "Fill rate", align: "right", sortValue: (r) => r.fillRate, cell: (r) => formatPercent(r.fillRate) },
    {
      key: "packages",
      header: "Package uses",
      align: "right",
      sortValue: (r) => r.attendedPackageUses,
      cell: (r) => (
        <span title={`${r.packageUses} booked with a package, ${r.attendedPackageUses} attended`}>
          {formatNumber(r.attendedPackageUses)}
        </span>
      ),
    },
    { key: "dropins", header: "Drop-ins", align: "right", sortValue: (r) => r.dropIns, cell: (r) => formatNumber(r.dropIns) },
    {
      key: "revenue",
      header: "Attributed revenue",
      align: "right",
      sortValue: (r) => r.attributedRevenue,
      cell: (r) => (
        <span
          title={`Drop-ins ${formatMoney(r.dropInRevenue)} · Package sessions ${formatMoney(r.packageValue)} · PT packages sold ${formatMoney(r.ptRevenue)}`}
          className="font-medium"
        >
          {formatMoney(r.attributedRevenue)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <StatGrid className="xl:grid-cols-5">
        <StatTile label="Coach hours" value={hoursFormat(t.hours)} hint="Class hours; co-taught classes count for each coach" emphasis />
        <StatTile label="Classes held" value={formatNumber(t.sessions)} hint={t.unassignedSessions ? `${t.unassignedSessions} without a coach` : undefined} />
        <StatTile label="PT sessions" value={formatNumber(t.ptSessions)} hint="Session counts only (no stored length)" />
        <StatTile label="Show-up rate" value={formatPercent(t.booked ? (t.attended / t.booked) * 100 : null)} hint={`${formatNumber(t.attended)} of ${formatNumber(t.booked)} bookings`} />
        <StatTile label="Active coaches" value={formatNumber(t.activeCoaches)} />
      </StatGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Hours by coach and session type"
          description="Class hours split by category."
          table={{
            rows: data.coaches,
            columns: [
              { key: "name", header: "Coach", cell: (r) => r.name },
              ...data.categories.map((c) => ({
                key: c.category,
                header: segmentLabel(c.category),
                align: "right" as const,
                cell: (r: CoachHoursRow) => hoursFormat(r.hoursByCategory[c.category] ?? 0),
              })),
              { key: "total", header: "Total", align: "right", cell: (r) => hoursFormat(r.hours) },
            ],
          }}
        >
          <ColumnChart
            data={perCoach}
            xKey="name"
            xFormatter={(v) => v}
            series={categorySeries}
            format={hoursFormat}
          />
        </ChartCard>
        <ChartCard
          title="Hours over time"
          description="All coach hours per period, by session type."
          table={{
            rows: data.trend,
            columns: [
              { key: "bucket", header: "Period", cell: (r) => formatBucket(r.bucket, true) },
              ...data.categories.map((c) => ({
                key: c.category,
                header: segmentLabel(c.category),
                align: "right" as const,
                cell: (r: CoachHoursData["trend"][number]) => hoursFormat(Number(r[c.category] ?? 0)),
              })),
            ],
          }}
        >
          <ColumnChart
            data={data.trend.map((row) => ({
              ...Object.fromEntries(data.categories.map((c) => [c.category, 0])),
              ...row,
            }))}
            series={categorySeries}
            format={hoursFormat}
          />
        </ChartCard>
      </div>

      <Card className="gap-3 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Coaches</CardTitle>
          <CardDescription className="text-xs">
            Attributed revenue = drop-in payments for their classes + value of package sessions attended (package
            price ÷ sessions) + PT packages sold under their name. Select a coach to see every package use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={data.coaches}
            rowKey={(r) => r.coachId}
            initialSort={{ key: "hours", dir: "desc" }}
            pageSize={15}
          />
        </CardContent>
      </Card>

      <ClassesCard rows={data.byClass} startDate={data.range.startDate} endDate={data.range.endDate} />
    </div>
  );
}

const coachNames = (r: CoachHoursClassRow) =>
  r.coaches.length ? r.coaches.map((c) => c.name).join(", ") : "No coach assigned";

/** Every class in the range, searchable, with package bookings, drop-ins and who taught it. */
function ClassesCard({ rows, startDate, endDate }: { rows: CoachHoursClassRow[]; startDate: string; endDate: string }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.classTitle, segmentLabel(r.category), ...r.coaches.map((c) => c.name)].some((v) => v.toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const exportCsv = () =>
    downloadCsv(`classes-${startDate}-to-${endDate}`, visible, [
      { header: "Class", value: (r) => r.classTitle },
      { header: "Type", value: (r) => segmentLabel(r.category) },
      { header: "Coaches", value: (r) => r.coaches.map((c) => `${c.name} (${c.sessions})`).join("; ") },
      { header: "Sessions", value: (r) => r.sessions },
      { header: "Sessions without a coach", value: (r) => r.unassignedSessions },
      { header: "Hours", value: (r) => r.hours },
      { header: "Package bookings", value: (r) => r.packageUses },
      { header: "Package bookings attended", value: (r) => r.attendedPackageUses },
      { header: "Packages used", value: (r) => r.packages.map((p) => `${p.name} (${p.uses})`).join("; ") },
      { header: "Package session value (EGP)", value: (r) => r.packageValue },
      { header: "Drop-ins", value: (r) => r.dropIns },
      { header: "Drop-ins attended", value: (r) => r.attendedDropIns },
      { header: "Drop-in revenue (EGP)", value: (r) => r.dropInRevenue },
      { header: "Booked", value: (r) => r.booked },
      { header: "Attended", value: (r) => r.attended },
      { header: "Show-up %", value: (r) => r.attendanceRate ?? "" },
      { header: "Fill %", value: (r) => r.fillRate ?? "" },
    ]);

  return (
    <Card className="gap-3 shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-sm font-semibold">Classes</CardTitle>
          <CardDescription className="text-xs">
            Every class held in this period: who taught it, how many bookings used a paid package, and how many were
            drop-ins. Hover a number for the breakdown.
          </CardDescription>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search class or coach"
            aria-label="Search classes"
            className="h-9 w-full sm:w-56"
          />
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCsv} disabled={!visible.length}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          rows={visible}
          rowKey={(r) => r.classTitle}
          initialSort={{ key: "sessions", dir: "desc" }}
          pageSize={50}
          columns={[
            { key: "title", header: "Class", sortValue: (r) => r.classTitle, cell: (r) => <span className="font-medium">{r.classTitle}</span> },
            { key: "category", header: "Type", sortValue: (r) => r.category, cell: (r) => segmentLabel(r.category) },
            {
              key: "coaches",
              header: "Coach",
              sortValue: (r) => coachNames(r),
              cell: (r) => (
                <span
                  title={r.coaches.map((c) => `${c.name}: ${c.sessions} session${c.sessions === 1 ? "" : "s"}`).join("\n")}
                  className={r.coaches.length ? undefined : "text-muted-foreground"}
                >
                  {coachNames(r)}
                  {r.unassignedSessions > 0 && r.coaches.length > 0 ? ` (+${r.unassignedSessions} without coach)` : ""}
                </span>
              ),
            },
            { key: "sessions", header: "Sessions", align: "right", sortValue: (r) => r.sessions, cell: (r) => formatNumber(r.sessions) },
            {
              key: "packages",
              header: "Paid packages",
              align: "right",
              sortValue: (r) => r.packageUses,
              cell: (r) => (
                <span
                  title={
                    r.packages.length
                      ? `${r.attendedPackageUses} of ${r.packageUses} attended\n` + r.packages.map((p) => `${p.name}: ${p.uses}`).join("\n")
                      : "No package bookings"
                  }
                >
                  {formatNumber(r.packageUses)}
                </span>
              ),
            },
            {
              key: "dropins",
              header: "Drop-ins",
              align: "right",
              sortValue: (r) => r.dropIns,
              cell: (r) => (
                <span title={`${r.attendedDropIns} of ${r.dropIns} attended ? ${formatMoney(r.dropInRevenue)} paid`}>
                  {formatNumber(r.dropIns)}
                </span>
              ),
            },
            { key: "dropin", header: "Drop-in revenue", align: "right", sortValue: (r) => r.dropInRevenue, cell: (r) => formatMoney(r.dropInRevenue) },
            { key: "attendance", header: "Show-up", align: "right", sortValue: (r) => r.attendanceRate, cell: (r) => formatPercent(r.attendanceRate) },
            { key: "fill", header: "Fill rate", align: "right", sortValue: (r) => r.fillRate, cell: (r) => formatPercent(r.fillRate) },
          ]}
        />
        {query && !visible.length ? (
          <p className="pt-3 text-center text-xs text-muted-foreground">No classes match ?{query}? in this period.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
