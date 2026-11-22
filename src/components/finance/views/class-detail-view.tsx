"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, History, Info, Presentation } from "lucide-react";
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
import {
  financeApi,
  type ClassDetailCoach,
  type ClassDetailData,
  type ClassDetailPurchase,
} from "@/lib/data/finance";
import { ClassHistoryCard } from "./class-history-card";
import { downloadCsv } from "../csv";
import { DataTable } from "../data-table";
import { EmptyState, FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatDate, formatDateTime, formatMoney, formatNumber, formatPercent } from "../format";
import { cn } from "@/lib/utils";
import { segmentLabel } from "../labels";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData, useFinanceFilters, useFinanceHref } from "../use-finance-data";

type PurchaseFilter = "all" | "NEW" | "RENEWAL" | "unlinked";

const plural = (n: number, word: string) =>
  `${formatNumber(n)} ${n === 1 ? word : /(ch|sh|s|x)$/.test(word) ? `${word}es` : `${word}s`}`;

export function ClassDetailView() {
  const { searchParams, setParams } = useFinanceFilters();
  const href = useFinanceHref();
  const classTitle = (searchParams.get("classTitle") ?? "").trim();
  const allTime = searchParams.get("allTime") === "1";
  const { data, loading, error, reload } = useFinanceData(
    financeApi.classDetail,
    { classTitle, allTime: allTime ? "1" : undefined },
    { enabled: Boolean(classTitle) },
  );

  const exportCoaches = (d: ClassDetailData) =>
    downloadCsv(`class-${slug(d.classTitle)}-coaches-${d.range.startDate}-to-${d.range.endDate}`, d.coaches, [
      { header: "Coach", value: (r) => r.name },
      { header: "Sessions", value: (r) => r.sessions },
      { header: "Co-taught sessions", value: (r) => r.coTaughtSessions },
      { header: "Hours", value: (r) => r.hours },
      { header: "Booked", value: (r) => r.booked },
      { header: "Attended", value: (r) => r.attended },
      { header: "Show-up %", value: (r) => r.attendanceRate ?? "" },
      { header: "Fill %", value: (r) => r.fillRate ?? "" },
      { header: "Paid package bookings", value: (r) => r.packageUses },
      { header: "Paid package bookings attended", value: (r) => r.attendedPackageUses },
      { header: "Packages used", value: (r) => r.packages.map((p) => `${p.name} (${p.uses})`).join("; ") },
      { header: "Package session value (EGP)", value: (r) => r.packageValue },
      { header: "Drop-ins", value: (r) => r.dropIns },
      { header: "Drop-ins attended", value: (r) => r.attendedDropIns },
      { header: "Drop-in revenue (EGP)", value: (r) => r.dropInRevenue },
      { header: "Packages bought", value: (r) => r.packagesBought },
      { header: "New packages", value: (r) => r.newPackages },
      { header: "Renewals", value: (r) => r.renewals },
      { header: "Package sales (EGP)", value: (r) => r.packageRevenue },
      { header: "Total brought in (EGP)", value: (r) => r.totalRevenue ?? coachTotal(r) },
      { header: "Members", value: (r) => r.uniqueMembers },
    ]);

  return (
    <FinancePage
      title={data?.classTitle ?? (classTitle || "Class")}
      description={
        data
          ? `${segmentLabel(data.category)} class: what each coach did, and the packages their members bought.`
          : "What each coach did in this class, and the packages their members bought."
      }
      icon={Presentation}
      displayRange={allTime && data?.allTime ? data.range : undefined}
      actions={
        <>
          <Button
            variant={allTime ? "default" : "outline"}
            size="sm"
            className="h-10 gap-1.5"
            aria-pressed={allTime}
            title={allTime ? "Back to the picked dates" : "Show everything since this class's first session"}
            onClick={() => setParams({ allTime: allTime ? undefined : "1" })}
          >
            <History className="h-4 w-4" />
            All history
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 gap-1.5">
            <Link href={href("/dashboard/finance/coach-hours")}>
              <ArrowLeft className="h-4 w-4" />
              Coach Hours
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5"
            disabled={!data}
            onClick={() => data && exportCoaches(data)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </>
      }
    >
      {!classTitle ? (
        <Card className="shadow-none">
          <CardContent>
            <EmptyState
              title="No class selected"
              description="Open Coach Hours and click a class in the Classes table to see its details."
            />
          </CardContent>
        </Card>
      ) : error ? (
        <FinanceError message={error} onRetry={reload} />
      ) : loading && !data ? (
        <FinanceLoading tiles={6} charts={0} />
      ) : data ? (
        <ClassDetailBody data={data} />
      ) : null}
    </FinancePage>
  );
}

const coachTotal = (r: ClassDetailCoach) => r.dropInRevenue + r.packageValue + r.packageRevenue;

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "class";
}

function ClassDetailBody({ data }: { data: ClassDetailData }) {
  const s = data.summary;
  const href = useFinanceHref();

  if (!s.sessions) {
    return (
      <Card className="shadow-none">
        <CardContent>
          <EmptyState
            title="This class wasn't held in this period"
            description="Pick another date range at the top of the page, or press All history."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.allTime && (
        <p className="-mt-2 text-xs text-muted-foreground">
          All history: from the first {data.classTitle} session on {formatDate(data.range.startDate)} to today.
        </p>
      )}
      <StatGrid className="lg:grid-cols-4 xl:grid-cols-7">
        <StatTile
          label="Sessions"
          value={formatNumber(s.sessions)}
          hint={`${formatNumber(s.hours)} h · ${plural(s.coaches, "coach")}${s.unassignedSessions ? ` · ${s.unassignedSessions} without a coach` : ""}`}
          emphasis
        />
        <StatTile
          label="Show-up rate"
          value={formatPercent(s.attendanceRate)}
          hint={`${formatNumber(s.attended)} of ${formatNumber(s.booked)} bookings · fill ${formatPercent(s.fillRate)}`}
        />
        <StatTile
          label="Paid package bookings"
          value={formatNumber(s.packageUses)}
          hint={`${formatNumber(s.attendedPackageUses)} attended · worth ${formatMoney(s.packageValue)}`}
        />
        <StatTile
          label="Drop-ins"
          value={formatNumber(s.dropIns)}
          hint={`${formatNumber(s.attendedDropIns)} attended · ${formatMoney(s.dropInRevenue)} paid`}
        />
        <StatTile
          label="Packages bought"
          value={formatNumber(s.packagesBought)}
          hint={`${formatNumber(s.newPackages)} new · ${formatNumber(s.renewals)} renewals`}
        />
        <StatTile
          label="Package sales"
          value={formatMoney(s.packageRevenue)}
          hint={`${plural(s.uniqueMembers, "member")} took this class`}
        />
        <StatTile
          label="Total brought in"
          value={formatMoney(s.totalRevenue ?? s.dropInRevenue + s.packageValue + s.packageRevenue)}
          hint="Drop-ins + package sessions used + packages bought"
          emphasis
        />
      </StatGrid>

      <Card className="gap-0 py-3 shadow-none">
        <CardContent className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-medium text-foreground">How packages bought are counted:</span> a paid package
            that opens this class goes to the coach of the member&apos;s last {data.classTitle} session in the{" "}
            {data.attributionDays} days before buying (or the first one after, if they bought first). It&apos;s a{" "}
            <span className="font-medium text-foreground">renewal</span> if the member had paid for a package that
            opens this class before; otherwise it&apos;s <span className="font-medium text-foreground">new</span>. A
            co-taught session counts for each coach on it; its money is split between them.
            {s.uncreditedPurchases > 0 && (
              <>
                {" "}
                {plural(s.uncreditedPurchases, "other purchase")} of packages valid for this class (
                {formatMoney(s.uncreditedRevenue)}) came from members who didn&apos;t take {data.classTitle} around
                then. They&apos;re listed below as &ldquo;Not linked&rdquo;.
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="gap-3 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Coaches</CardTitle>
          <CardDescription className="text-xs">
            Everything each coach did in {data.classTitle}, and the money linked to them: drop-ins paid, the value of
            package sessions their members used (package price ÷ sessions), and packages bought credited to them.
            Hover a number for the breakdown; click a coach to see all their classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<ClassDetailCoach>
            rows={data.coaches}
            rowKey={(r) => r.coachId}
            initialSort={{ key: "sessions", dir: "desc" }}
            pageSize={50}
            columns={[
              {
                key: "name",
                header: "Coach",
                sortValue: (r) => r.name,
                cell: (r) =>
                  r.coachId === "unassigned" ? (
                    <span className="text-muted-foreground">{r.name}</span>
                  ) : (
                    <Link
                      href={href("/dashboard/finance/coach-packages", { coachId: r.coachId })}
                      className="font-medium hover:underline"
                    >
                      {r.name}
                    </Link>
                  ),
              },
              {
                key: "sessions",
                header: "Sessions",
                align: "right",
                sortValue: (r) => r.sessions,
                cell: (r) => (
                  <span title={`${formatNumber(r.hours)} h${r.coTaughtSessions ? ` · ${r.coTaughtSessions} co-taught` : ""}`}>
                    {formatNumber(r.sessions)}
                  </span>
                ),
              },
              {
                key: "attended",
                header: "Attended / booked",
                align: "right",
                sortValue: (r) => r.attended,
                cell: (r) => `${formatNumber(r.attended)} / ${formatNumber(r.booked)}`,
              },
              { key: "showup", header: "Show-up", align: "right", sortValue: (r) => r.attendanceRate, cell: (r) => formatPercent(r.attendanceRate) },
              {
                key: "packages",
                header: "Paid packages",
                align: "right",
                sortValue: (r) => r.packageUses,
                cell: (r) => (
                  <span
                    title={
                      r.packages.length
                        ? `${r.attendedPackageUses} of ${r.packageUses} attended · worth ${formatMoney(r.packageValue)}\n` +
                          r.packages.map((p) => `${p.name}: ${p.uses}`).join("\n")
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
                cell: (r) => <span title={`${r.attendedDropIns} of ${r.dropIns} attended`}>{formatNumber(r.dropIns)}</span>,
              },
              { key: "dropinRev", header: "Drop-in revenue", align: "right", sortValue: (r) => r.dropInRevenue, cell: (r) => formatMoney(r.dropInRevenue) },
              {
                key: "bought",
                header: "Packages bought",
                align: "right",
                sortValue: (r) => r.packagesBought,
                cell: (r) => <span className="font-medium">{formatNumber(r.packagesBought)}</span>,
              },
              { key: "new", header: "New", align: "right", sortValue: (r) => r.newPackages, cell: (r) => formatNumber(r.newPackages) },
              { key: "renewals", header: "Renewals", align: "right", sortValue: (r) => r.renewals, cell: (r) => formatNumber(r.renewals) },
              { key: "sales", header: "Package sales", align: "right", sortValue: (r) => r.packageRevenue, cell: (r) => formatMoney(r.packageRevenue) },
              {
                key: "value",
                header: "Package value used",
                align: "right",
                sortValue: (r) => r.packageValue,
                cell: (r) => (
                  <span title={`${formatNumber(r.attendedPackageUses)} attended package sessions × package price ÷ sessions`}>
                    {formatMoney(r.packageValue)}
                  </span>
                ),
              },
              {
                key: "total",
                header: "Total brought in",
                align: "right",
                sortValue: (r) => r.totalRevenue ?? coachTotal(r),
                cell: (r) => (
                  <span
                    className={cn("font-semibold", r.coachId === "unassigned" && "font-normal text-muted-foreground")}
                    title={`Drop-ins ${formatMoney(r.dropInRevenue)}
Package sessions used ${formatMoney(r.packageValue)}
Packages bought ${formatMoney(r.packageRevenue)}`}
                  >
                    {formatMoney(r.totalRevenue ?? coachTotal(r))}
                  </span>
                ),
              },
              { key: "members", header: "Members", align: "right", sortValue: (r) => r.uniqueMembers, cell: (r) => formatNumber(r.uniqueMembers) },
            ]}
          />
        </CardContent>
      </Card>

      <ClassHistoryCard data={data} />
      <PurchasesCard data={data} />
    </div>
  );
}

function PurchasesCard({ data }: { data: ClassDetailData }) {
  const [filter, setFilter] = useState<PurchaseFilter>("all");
  const [query, setQuery] = useState("");
  const coachOptions = useMemo(
    () => [...new Set(data.purchases.flatMap((p) => p.coaches))].sort((a, b) => a.localeCompare(b)),
    [data.purchases],
  );
  const [coach, setCoach] = useState<string>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.purchases.filter((p) => {
      if (filter === "unlinked" ? p.coaches.length > 0 : filter !== "all" && (p.type !== filter || !p.coaches.length))
        return false;
      if (coach !== "all" && !p.coaches.includes(coach)) return false;
      if (q && ![p.memberName, p.phone, p.packageName].some((v) => (v ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data.purchases, filter, coach, query]);

  const exportCsv = () =>
    downloadCsv(`class-${slug(data.classTitle)}-packages-bought-${data.range.startDate}-to-${data.range.endDate}`, rows, [
      { header: "Date", value: (r) => formatDateTime(r.date) },
      { header: "Member", value: (r) => r.memberName },
      { header: "Phone", value: (r) => r.phone },
      { header: "Package", value: (r) => r.packageName },
      { header: "Type", value: (r) => (r.type === "RENEWAL" ? "Renewal" : "New") },
      { header: "Amount (EGP)", value: (r) => r.amount },
      { header: "Payment method", value: (r) => r.paymentMethod },
      { header: "Refunded", value: (r) => (r.refunded ? "Yes" : "No") },
      { header: "Credited to", value: (r) => r.coaches.join(", ") || "Not linked" },
      { header: "Session credited", value: (r) => (r.creditedSessionDate ? formatDateTime(r.creditedSessionDate) : "") },
    ]);

  return (
    <Card className="gap-3 shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-sm font-semibold">Packages bought</CardTitle>
          <CardDescription className="text-xs">
            Every paid package valid for {data.classTitle} bought in this period, and which coach it&apos;s credited to.
          </CardDescription>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select value={filter} onValueChange={(v) => setFilter(v as PurchaseFilter)}>
            <SelectTrigger className="h-9 w-full sm:w-36" aria-label="Purchase type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All purchases</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="RENEWAL">Renewals</SelectItem>
              <SelectItem value="unlinked">Not linked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={coach} onValueChange={setCoach}>
            <SelectTrigger className="h-9 w-full sm:w-40" aria-label="Coach">
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
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member or package"
            aria-label="Search purchases"
            className="h-9 w-full sm:w-52"
          />
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable<ClassDetailPurchase>
          rows={rows}
          rowKey={(r) => r.id}
          initialSort={{ key: "date", dir: "desc" }}
          pageSize={25}
          emptyText="No package purchases match."
          rowClassName={(r) => (r.refunded ? "opacity-60" : undefined)}
          columns={[
            { key: "date", header: "Date", sortValue: (r) => r.date, cell: (r) => formatDateTime(r.date) },
            {
              key: "member",
              header: "Member",
              sortValue: (r) => r.memberName,
              cell: (r) => (
                <div className="min-w-0">
                  <p className="font-medium">{r.memberName}</p>
                  {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                </div>
              ),
            },
            { key: "package", header: "Package", sortValue: (r) => r.packageName, cell: (r) => r.packageName },
            {
              key: "type",
              header: "Type",
              sortValue: (r) => r.type,
              cell: (r) => (
                <div className="flex flex-wrap gap-1">
                  <Badge variant={r.type === "RENEWAL" ? "secondary" : "outline"} className="text-[11px]">
                    {r.type === "RENEWAL" ? "Renewal" : "New"}
                  </Badge>
                  {r.refunded && (
                    <Badge variant="destructive" className="text-[11px]">
                      Refunded
                    </Badge>
                  )}
                </div>
              ),
            },
            { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, cell: (r) => formatMoney(r.amount) },
            {
              key: "coach",
              header: "Credited to",
              sortValue: (r) => r.coaches.join(", "),
              cell: (r) =>
                r.coaches.length ? (
                  <div className="min-w-0">
                    <p>{r.coaches.join(", ")}</p>
                    {r.creditedSessionDate && (
                      <p className="text-xs text-muted-foreground">Class on {formatDate(r.creditedSessionDate)}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground" title={`Didn't take ${data.classTitle} within ${data.attributionDays} days of buying`}>
                    Not linked
                  </span>
                ),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
