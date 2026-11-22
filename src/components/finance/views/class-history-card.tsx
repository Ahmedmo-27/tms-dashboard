"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  financeApi,
  type ClassDayData,
  type ClassDetailData,
  type ClassDetailDay,
} from "@/lib/data/finance";
import { cn } from "@/lib/utils";
import { ColumnChart, type Series } from "../charts";
import { downloadCsv } from "../csv";
import { DataTable } from "../data-table";
import { formatBucket, formatDate, formatMoney, formatNumber, formatPercent } from "../format";
import { useFinanceFilters } from "../use-finance-data";

const MONEY_SERIES: Series[] = [
  { key: "dropInRevenue", label: "Drop-ins", color: "var(--viz-1)" },
  { key: "packageValue", label: "Package sessions used", color: "var(--viz-2)" },
  { key: "packageRevenue", label: "Packages bought", color: "var(--viz-3)" },
];

const weekday = (dateKey: string) =>
  new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });

/** The class's history: money per period, and every day it ran with what happened that day. */
export function ClassHistoryCard({ data }: { data: ClassDetailData }) {
  const days = useMemo(() => data.days ?? [], [data.days]);
  const coachOptions = useMemo(
    () => [...new Set(days.flatMap((d) => d.coaches))].filter((c) => c !== "No coach assigned").sort((a, b) => a.localeCompare(b)),
    [days],
  );
  const [coach, setCoach] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => (coach === "all" ? days : days.filter((d) => d.coaches.includes(coach))), [days, coach]);

  const exportCsv = () =>
    downloadCsv(`class-${data.classTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-history-${data.range.startDate}-to-${data.range.endDate}`, rows, [
      { header: "Date", value: (r) => r.date },
      { header: "Day", value: (r) => weekday(r.date) },
      { header: "Sessions", value: (r) => r.sessions },
      { header: "Coaches", value: (r) => r.coaches.join("; ") },
      { header: "Booked", value: (r) => r.booked },
      { header: "Attended", value: (r) => r.attended },
      { header: "Show-up %", value: (r) => r.attendanceRate ?? "" },
      { header: "Paid package bookings", value: (r) => r.packageUses },
      { header: "Drop-ins", value: (r) => r.dropIns },
      { header: "Drop-in revenue (EGP)", value: (r) => r.dropInRevenue },
      { header: "Package value used (EGP)", value: (r) => r.packageValue },
      { header: "Packages bought", value: (r) => r.packagesBought },
      { header: "New", value: (r) => r.newPackages },
      { header: "Renewals", value: (r) => r.renewals },
      { header: "Package sales (EGP)", value: (r) => r.packageRevenue },
      { header: "Not linked purchases", value: (r) => r.otherPurchases },
      { header: "Total brought in (EGP)", value: (r) => r.totalRevenue },
    ]);

  if (!data.days) return null;

  const trend = data.trend ?? [];
  const perMonth = data.granularity === "month";

  return (
    <Card className="gap-3 shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-sm font-semibold">History</CardTitle>
          <CardDescription className="text-xs">
            Every day {data.classTitle} ran or a package for it was bought, newest first. Click a day to see each
            session, who came, how they paid, and the packages bought that day.
          </CardDescription>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select value={coach} onValueChange={setCoach}>
            <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Coach">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All coaches</SelectItem>
              {coachOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {trend.length > 1 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Money brought in per {perMonth ? "month" : "day"}
            </p>
            <ColumnChart data={trend} series={MONEY_SERIES} format={formatMoney} height={220} xFormatter={(v) => formatBucket(v)} />
          </div>
        )}
        <DataTable<ClassDetailDay>
          rows={rows}
          rowKey={(r) => r.date}
          initialSort={{ key: "date", dir: "desc" }}
          pageSize={31}
          emptyText="Nothing happened in this class in this period."
          expandable={{
            isExpanded: (r) => open === r.date,
            onToggle: (r) => setOpen((cur) => (cur === r.date ? null : r.date)),
            render: (r) => <DayDetail classTitle={data.classTitle} date={r.date} />,
            label: (r) => `Show ${formatDate(r.date)}`,
          }}
          columns={[
            {
              key: "date",
              header: "Day",
              sortValue: (r) => r.date,
              cell: (r) => (
                <span className="whitespace-nowrap font-medium">
                  {weekday(r.date)} {formatDate(r.date)}
                </span>
              ),
            },
            {
              key: "coaches",
              header: "Coach",
              sortValue: (r) => r.coaches.join(", "),
              cell: (r) =>
                r.sessions ? (
                  <span className="whitespace-nowrap">{r.coaches.join(", ")}</span>
                ) : (
                  <span className="text-muted-foreground">No class</span>
                ),
            },
            { key: "sessions", header: "Sessions", align: "right", sortValue: (r) => r.sessions, cell: (r) => formatNumber(r.sessions) },
            {
              key: "attended",
              header: "Attended / booked",
              align: "right",
              sortValue: (r) => r.attended,
              cell: (r) => (r.sessions ? `${formatNumber(r.attended)} / ${formatNumber(r.booked)}` : "—"),
            },
            { key: "showup", header: "Show-up", align: "right", sortValue: (r) => r.attendanceRate, cell: (r) => formatPercent(r.attendanceRate) },
            {
              key: "packages",
              header: "Paid packages",
              align: "right",
              sortValue: (r) => r.packageUses,
              cell: (r) => <span title={`${r.attendedPackageUses} attended · worth ${formatMoney(r.packageValue)}`}>{formatNumber(r.packageUses)}</span>,
            },
            {
              key: "dropins",
              header: "Drop-ins",
              align: "right",
              sortValue: (r) => r.dropIns,
              cell: (r) => <span title={`${r.attendedDropIns} attended · ${formatMoney(r.dropInRevenue)} paid`}>{formatNumber(r.dropIns)}</span>,
            },
            {
              key: "bought",
              header: "Packages bought",
              align: "right",
              sortValue: (r) => r.packagesBought,
              cell: (r) => (
                <span
                  title={`${r.newPackages} new · ${r.renewals} renewals · ${formatMoney(r.packageRevenue)}${r.otherPurchases ? `\n${r.otherPurchases} more not linked to a coach` : ""}`}
                >
                  {formatNumber(r.packagesBought)}
                  {r.otherPurchases ? <span className="text-muted-foreground"> +{r.otherPurchases}</span> : null}
                </span>
              ),
            },
            {
              key: "total",
              header: "Brought in",
              align: "right",
              sortValue: (r) => r.totalRevenue,
              cell: (r) => (
                <span
                  className="font-semibold"
                  title={`Drop-ins ${formatMoney(r.dropInRevenue)}\nPackage sessions used ${formatMoney(r.packageValue)}\nPackages bought ${formatMoney(r.packageRevenue)}`}
                >
                  {formatMoney(r.totalRevenue)}
                </span>
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

const KIND_LABEL: Record<string, string> = { PACKAGE: "Package", DROP_IN: "Drop-in", NON_MEMBER: "Non-member" };

/** One day, loaded when it is opened. */
function DayDetail({ classTitle, date }: { classTitle: string; date: string }) {
  const { locationId } = useFinanceFilters();
  const [state, setState] = useState<{ data: ClassDayData | null; error: string | null }>({ data: null, error: null });

  useEffect(() => {
    let live = true;
    setState({ data: null, error: null });
    financeApi
      .classDay({ classTitle, date, locationId })
      .then((data) => live && setState({ data, error: null }))
      .catch((e: unknown) => live && setState({ data: null, error: e instanceof Error ? e.message : "Could not load this day" }));
    return () => {
      live = false;
    };
  }, [classTitle, date, locationId]);

  if (state.error) return <p className="py-3 text-xs text-destructive">{state.error}</p>;
  if (!state.data) {
    return (
      <div className="flex flex-col gap-2 py-3" aria-busy="true">
        <Skeleton className="h-5 w-60" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const { sessions, purchases } = state.data;
  return (
    <div className="flex flex-col gap-4 py-3">
      {sessions.map((s) => (
        <div key={s.id} className="rounded-lg border bg-background">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-xs">
            <p>
              <span className="font-semibold text-foreground">{timeOf(s.start)}</span>
              <span className="text-muted-foreground"> · {s.coaches.join(", ")} · {s.branch} · {formatNumber(s.hours)} h</span>
            </p>
            <p className="text-muted-foreground">
              {formatNumber(s.attended)} of {formatNumber(s.booked)} came · {formatNumber(s.capacity)} spots · drop-ins{" "}
              {formatMoney(s.dropInRevenue)} · package value {formatMoney(s.packageValue)}
            </p>
          </div>
          {s.attendees.length ? (
            <ul className="divide-y text-xs">
              {s.attendees.map((a, i) => (
                <li key={`${s.id}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5">
                  <div className="min-w-0">
                    <span className={cn("font-medium", !a.attended && "text-muted-foreground")}>{a.name}</span>
                    {a.phone && <span className="text-muted-foreground"> · {a.phone}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{a.kind === "PACKAGE" ? a.packageName : KIND_LABEL[a.kind]}</span>
                    <span className="w-24 text-right tabular-nums">
                      {a.kind === "PACKAGE"
                        ? a.sessionValue !== null
                          ? `≈ ${formatMoney(a.sessionValue)}`
                          : "—"
                        : a.paidAmount !== null
                          ? formatMoney(a.paidAmount)
                          : "Not paid"}
                    </span>
                    <Badge variant={a.attended ? "secondary" : "outline"} className="w-[70px] justify-center text-[11px]">
                      {a.attended ? "Came" : "No-show"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">No bookings.</p>
          )}
        </div>
      ))}
      {purchases.length > 0 && (
        <div className="rounded-lg border bg-background">
          <p className="border-b px-3 py-2 text-xs font-semibold">Packages bought this day</p>
          <ul className="divide-y text-xs">
            {purchases.map((p) => (
              <li key={p.id} className={cn("flex flex-wrap items-center justify-between gap-2 px-3 py-1.5", p.refunded && "opacity-60")}>
                <div className="min-w-0">
                  <span className="font-medium">{p.memberName}</span>
                  <span className="text-muted-foreground"> · {p.packageName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {p.coaches.length ? `Credited to ${p.coaches.join(", ")}` : "Not linked to a coach"}
                  </span>
                  <Badge variant={p.type === "RENEWAL" ? "secondary" : "outline"} className="text-[11px]">
                    {p.type === "RENEWAL" ? "Renewal" : "New"}
                  </Badge>
                  {p.refunded && (
                    <Badge variant="destructive" className="text-[11px]">
                      Refunded
                    </Badge>
                  )}
                  <span className="w-24 text-right font-medium tabular-nums">{formatMoney(p.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!sessions.length && !purchases.length && <p className="text-xs text-muted-foreground">Nothing recorded this day.</p>}
    </div>
  );
}
