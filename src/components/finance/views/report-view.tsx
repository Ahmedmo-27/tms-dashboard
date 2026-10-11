"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Printer } from "lucide-react";
import { endOfMonth, format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  financeApi,
  type CoachHoursData,
  type DeferredData,
  type OverviewData,
  type RefundsData,
  type RetentionData,
} from "@/lib/data/finance";
import { downloadCsv } from "../csv";
import { FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { CAIRO_TZ, formatMoney, formatNumber, formatPercent } from "../format";
import { methodLabel, segmentLabel } from "../labels";
import { useFinanceFilters, useFinanceHref } from "../use-finance-data";

type ReportData = {
  overview: OverviewData;
  coaches: CoachHoursData;
  refunds: RefundsData;
  deferred: DeferredData;
  retention: RetentionData;
};

const MONTH_KEY = /^\d{4}-\d{2}$/;

export function ReportView() {
  const { searchParams, setParams, locationId } = useFinanceFilters();
  const href = useFinanceHref();
  const thisMonth = formatInTimeZone(new Date(), CAIRO_TZ, "yyyy-MM");
  const rawMonth = searchParams.get("month") ?? "";
  const month = MONTH_KEY.test(rawMonth) ? rawMonth : thisMonth;

  const range = useMemo(() => {
    const start = `${month}-01`;
    const today = formatInTimeZone(new Date(), CAIRO_TZ, "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(parseISO(start)), "yyyy-MM-dd");
    return { startDate: start, endDate: monthEnd > today && month === thisMonth ? today : monthEnd };
  }, [month, thisMonth]);

  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    const params = { ...range, locationId };
    Promise.all([
      financeApi.overview(params),
      financeApi.coachHours(params),
      financeApi.refunds(params),
      financeApi.deferred(params),
      financeApi.retention(params),
    ])
      .then(([overview, coaches, refunds, deferred, retention]) => {
        if (!cancelled) setData({ overview, coaches, refunds, deferred, retention });
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Could not build the report");
      });
    return () => {
      cancelled = true;
    };
  }, [range, locationId, attempt]);

  const monthLabel = format(parseISO(`${month}-01`), "MMMM yyyy");
  const branchLabel = data?.overview.byBranch.length === 1 && locationId ? data.overview.byBranch[0].branchName : locationId ? "Selected branch" : "All branches";

  const exportCsv = () => {
    if (!data) return;
    const s = data.overview.summary.current;
    const rows: { section: string; item: string; value: string | number }[] = [
      { section: "Summary", item: "Gross revenue", value: s.gross },
      { section: "Summary", item: "Refunds", value: s.refunds },
      { section: "Summary", item: "Net revenue", value: s.net },
      { section: "Summary", item: "Cash outs", value: s.cashOuts },
      { section: "Summary", item: "Net after cash outs", value: s.netCash },
      { section: "Summary", item: "Transactions", value: s.transactions },
      { section: "Summary", item: "Unearned revenue (as of today)", value: data.deferred.totals.unearned },
      ...data.overview.bySegment.map((r) => ({ section: "Revenue by type", item: segmentLabel(r.segment), value: r.amount })),
      ...data.overview.byMethod.map((r) => ({ section: "Payment methods", item: methodLabel(r.method), value: r.amount })),
      ...data.overview.byBranch.map((r) => ({ section: "Branches (net)", item: r.branchName, value: r.net })),
      ...data.coaches.coaches.map((r) => ({ section: "Coach hours", item: r.name, value: r.hours })),
      ...data.coaches.coaches.map((r) => ({ section: "Coach PT sessions", item: r.name, value: r.ptSessions })),
      ...data.refunds.byReason.map((r) => ({ section: `${segmentLabel(r.type)} reasons`, item: r.reason, value: r.amount })),
    ];
    downloadCsv(`monthly-report-${month}`, rows, [
      { header: "Section", value: (r) => r.section },
      { header: "Item", value: (r) => r.item },
      { header: "Value", value: (r) => r.value },
    ]);
  };

  return (
    <FinancePage
      title="Monthly Report"
      description="A one-page summary to print or share."
      icon={FileText}
      showDateRange={false}
      filters={
        <Input
          type="month"
          value={month}
          max={thisMonth}
          onChange={(e) => MONTH_KEY.test(e.target.value) && setParams({ month: e.target.value })}
          className="h-10 w-[170px]"
          aria-label="Report month"
        />
      }
      actions={
        <>
          <Button asChild variant="ghost" size="sm" className="h-10 gap-1.5">
            <Link href={href("/dashboard/finance")}>
              <ArrowLeft className="h-4 w-4" />
              Overview
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-10 gap-1.5" disabled={!data} onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="h-10 gap-1.5" disabled={!data} onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </>
      }
    >
      {error ? (
        <FinanceError message={error} onRetry={() => setAttempt((a) => a + 1)} />
      ) : !data ? (
        <FinanceLoading tiles={4} charts={2} />
      ) : (
        <article id="finance-report" className="mx-auto w-full max-w-4xl rounded-xl border bg-card p-6 sm:p-10 print:border-0 print:p-0">
          <header className="flex flex-col gap-1 border-b pb-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">The Mind Space · Finance report</p>
            <h2 className="text-2xl font-semibold tracking-tight">{monthLabel}</h2>
            <p className="text-xs text-muted-foreground">
              {branchLabel} · {range.startDate} to {range.endDate} · generated{" "}
              {formatInTimeZone(new Date(), CAIRO_TZ, "dd MMM yyyy, HH:mm")}
            </p>
          </header>
          <ReportBody data={data} />
        </article>
      )}
    </FinancePage>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid pt-6">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function ReportBody({ data }: { data: ReportData }) {
  const { current, deltas } = data.overview.summary;
  const change = (v: number | null) => (v === null ? "" : ` (${v >= 0 ? "+" : ""}${formatPercent(v)} vs previous)`);
  const coaches = data.coaches.coaches.slice(0, 10);

  return (
    <div className="grid gap-x-10 sm:grid-cols-2">
      <Section title="Summary">
        <Row label="Gross revenue" value={formatMoney(current.gross)} />
        <Row label="Refunds" value={`−${formatMoney(current.refunds)}`} />
        <Row label="Net revenue" value={`${formatMoney(current.net)}${change(deltas.net)}`} strong />
        <Row label="Cash outs" value={`−${formatMoney(current.cashOuts)}`} />
        <Row label="Net after cash outs" value={formatMoney(current.netCash)} strong />
        <Row label="Transactions" value={formatNumber(current.transactions)} />
        <Row label="Average payment" value={formatMoney(current.avgTicket)} />
      </Section>

      <Section title="Obligations & members">
        <Row label="Unearned revenue (today)" value={formatMoney(data.deferred.totals.unearned)} strong />
        <Row label="Sessions owed (today)" value={formatNumber(data.deferred.totals.sessionsOwed)} />
        <Row label="Earned this month" value={formatMoney(data.deferred.totals.earnedInRange)} />
        <Row label="Expired unused" value={formatMoney(data.deferred.totals.breakageInRange)} />
        <Row label="Renewal rate" value={formatPercent(data.retention.totals.renewalRate)} />
        <Row label="Active members" value={formatNumber(data.retention.totals.activeMembers)} />
        <Row label="First-time buyers" value={formatNumber(data.retention.totals.newPayingMembers)} />
      </Section>

      <Section title="Revenue by type">
        {data.overview.bySegment.map((r) => (
          <Row key={r.segment} label={`${segmentLabel(r.segment)} (${r.count})`} value={formatMoney(r.amount)} />
        ))}
      </Section>

      <Section title="Payment methods">
        {data.overview.byMethod.map((r) => (
          <Row
            key={r.method}
            label={methodLabel(r.method)}
            value={`${formatMoney(r.amount)} · ${current.gross ? formatPercent((r.amount / current.gross) * 100, 0) : "—"}`}
          />
        ))}
      </Section>

      <Section title="Branches">
        {data.overview.byBranch.map((r) => (
          <Row key={r.locationId} label={r.branchName} value={`${formatMoney(r.net)} net`} />
        ))}
      </Section>

      <Section title="Refunds & cash outs">
        <Row label="Refund rate" value={formatPercent(data.refunds.totals.refundRate)} />
        {data.refunds.byReason.slice(0, 6).map((r) => (
          <Row key={`${r.type}-${r.reason}`} label={`${r.reason} (${segmentLabel(r.type)})`} value={formatMoney(r.amount)} />
        ))}
      </Section>

      <section className="break-inside-avoid pt-6 sm:col-span-2">
        <h3 className="mb-2 text-sm font-semibold">Coaches</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-medium">Coach</th>
              <th className="py-1.5 text-right font-medium">Class hours</th>
              <th className="py-1.5 text-right font-medium">Classes</th>
              <th className="py-1.5 text-right font-medium">PT sessions</th>
              <th className="py-1.5 text-right font-medium">Package uses</th>
              <th className="py-1.5 text-right font-medium">Attributed revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coaches.map((c) => (
              <tr key={c.coachId}>
                <td className="py-1.5">{c.name}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNumber(c.hours)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNumber(c.sessions)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNumber(c.ptSessions)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNumber(c.attendedPackageUses)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatMoney(c.attributedRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
