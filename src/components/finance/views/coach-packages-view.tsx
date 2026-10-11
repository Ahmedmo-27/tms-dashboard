"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Download, Search, XCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  financeApi,
  type CoachHoursRow,
  type CoachUsageData,
  type CoachUsageEntry,
} from "@/lib/data/finance";
import { ChartCard } from "../chart-card";
import { BarList } from "../charts";
import { downloadCsv } from "../csv";
import { DataTable, type DataColumn } from "../data-table";
import { EmptyState, FinanceError, FinanceLoading, FinancePage } from "../finance-page";
import { formatDateTime, formatMoney, formatNumber } from "../format";
import { segmentLabel } from "../labels";
import { StatGrid, StatTile } from "../stat-tile";
import { useFinanceData, useFinanceFilters } from "../use-finance-data";

type EntryFilter = "all" | "packages" | "pt" | "dropins";

export function CoachPackagesView() {
  const { searchParams, setParams } = useFinanceFilters();
  const coachId = searchParams.get("coachId") ?? "";
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    financeApi.coaches().then(setCoaches).catch(() => setCoaches([]));
  }, []);

  const usage = useFinanceData(
    (p) => financeApi.coachUsage(coachId, p),
    { coachId },
    { enabled: Boolean(coachId) },
  );
  const ranking = useFinanceData(financeApi.coachHours, {}, { enabled: !coachId });

  const active = coachId ? usage : ranking;
  const coachPicker = (
    <Select value={coachId || "none"} onValueChange={(v) => setParams({ coachId: v === "none" ? undefined : v })}>
      <SelectTrigger className="h-10 w-full sm:w-[220px]">
        <SelectValue placeholder="Choose a coach" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">All coaches (ranking)</SelectItem>
        {coaches.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <FinancePage
      title="Coach Package Tracking"
      description="Every package used in a coach's sessions, member by member."
      icon={ClipboardList}
      filters={coachPicker}
    >
      {active.error ? (
        <FinanceError message={active.error} onRetry={active.reload} />
      ) : active.loading && !active.data ? (
        <FinanceLoading tiles={6} />
      ) : coachId && usage.data ? (
        <CoachUsageBody data={usage.data} />
      ) : !coachId && ranking.data ? (
        <RankingBody rows={ranking.data.coaches} onSelect={(id) => setParams({ coachId: id })} />
      ) : null}
    </FinancePage>
  );
}

function RankingBody({ rows, onSelect }: { rows: CoachHoursRow[]; onSelect: (id: string) => void }) {
  return (
    <Card className="gap-3 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Coach ranking</CardTitle>
        <CardDescription className="text-xs">
          Package uses per coach in this period, including PT. Select a coach to see every entry.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          rows={rows}
          rowKey={(r) => r.coachId}
          initialSort={{ key: "attended", dir: "desc" }}
          pageSize={20}
          columns={[
            {
              key: "name",
              header: "Coach",
              sortValue: (r) => r.name,
              cell: (r) => (
                <button type="button" onClick={() => onSelect(r.coachId)} className="font-medium hover:underline cursor-pointer">
                  {r.name}
                </button>
              ),
            },
            { key: "sessions", header: "Sessions", align: "right", sortValue: (r) => r.sessions + r.ptSessions, cell: (r) => formatNumber(r.sessions + r.ptSessions) },
            { key: "booked", header: "Package uses (booked)", align: "right", sortValue: (r) => r.packageUses, cell: (r) => formatNumber(r.packageUses) },
            { key: "attended", header: "Package uses (attended)", align: "right", sortValue: (r) => r.attendedPackageUses, cell: (r) => <span className="font-medium">{formatNumber(r.attendedPackageUses)}</span> },
            { key: "dropins", header: "Drop-ins", align: "right", sortValue: (r) => r.dropIns, cell: (r) => formatNumber(r.dropIns) },
            { key: "members", header: "Members", align: "right", sortValue: (r) => r.uniqueMembers, cell: (r) => formatNumber(r.uniqueMembers) },
            { key: "value", header: "Package session value", align: "right", sortValue: (r) => r.packageValue, cell: (r) => formatMoney(r.packageValue) },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function CoachUsageBody({ data }: { data: CoachUsageData }) {
  const s = data.summary;
  const [filter, setFilter] = useState<EntryFilter>("packages");
  const [attendedOnly, setAttendedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState<string | null>(null);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.entries.filter((e) => {
      if (filter === "packages" && e.isDropIn) return false;
      if (filter === "pt" && e.type !== "PT") return false;
      if (filter === "dropins" && !e.isDropIn) return false;
      if (attendedOnly && !e.attended) return false;
      if (memberFilter && (e.memberId ?? `${e.phone}|${e.memberName}`) !== memberFilter) return false;
      if (q) {
        return [e.memberName, e.phone, e.packageName, e.classTitle, e.branch].some((v) =>
          v.toLowerCase().includes(q),
        );
      }
      return true;
    });
  }, [data.entries, filter, attendedOnly, query, memberFilter]);

  const exportCsv = () =>
    downloadCsv(`coach-${data.coach.name.replace(/\s+/g, "-").toLowerCase()}-${data.range.startDate}-to-${data.range.endDate}`, entries, [
      { header: "Date", value: (r) => formatDateTime(r.date) },
      { header: "Session", value: (r) => r.classTitle },
      { header: "Session type", value: (r) => segmentLabel(r.category) },
      { header: "Source", value: (r) => r.source },
      { header: "Member", value: (r) => r.memberName },
      { header: "Phone", value: (r) => r.phone },
      { header: "Package", value: (r) => r.packageName },
      { header: "Attended", value: (r) => (r.attended ? "Yes" : "No") },
      { header: "Session value (EGP)", value: (r) => r.sessionValue ?? "" },
      { header: "Branch", value: (r) => r.branch },
    ]);

  const selectedMember = memberFilter
    ? data.byMember.find((m) => (m.memberId ?? `${m.phone}|${m.memberName}`) === memberFilter)
    : null;

  const entryColumns: DataColumn<CoachUsageEntry>[] = [
    { key: "date", header: "Date", cell: (r) => <span className="whitespace-nowrap">{formatDateTime(r.date)}</span> },
    {
      key: "session",
      header: "Session",
      cell: (r) => (
        <div className="min-w-[130px]">
          <p>{r.classTitle}</p>
          <p className="text-[11px] text-muted-foreground">{r.type === "PT" ? r.source : segmentLabel(r.category)}</p>
        </div>
      ),
    },
    {
      key: "member",
      header: "Member",
      cell: (r) => (
        <div className="min-w-[130px]">
          <p className="font-medium">{r.memberName}</p>
          {r.phone && <p className="text-[11px] text-muted-foreground">{r.phone}</p>}
        </div>
      ),
    },
    {
      key: "package",
      header: "Package used",
      cell: (r) => (r.isDropIn ? <Badge variant="outline">{r.packageName}</Badge> : r.packageName),
    },
    {
      key: "attended",
      header: "Attended",
      cell: (r) =>
        r.attended ? (
          <span className="inline-flex items-center gap-1" style={{ color: "var(--viz-good)" }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <XCircle className="h-3.5 w-3.5" /> No
          </span>
        ),
    },
    { key: "value", header: "Session value", align: "right", cell: (r) => (r.sessionValue ? formatMoney(r.sessionValue) : "—") },
    { key: "branch", header: "Branch", cell: (r) => r.branch },
  ];

  return (
    <div className="flex flex-col gap-5">
      <StatGrid className="xl:grid-cols-6">
        <StatTile
          label={`${data.coach.name} · sessions`}
          value={formatNumber(s.totalSessions)}
          hint={`${s.classSessions} classes (${formatNumber(s.classHours)} h) · ${s.ptSessions} PT`}
          emphasis
          className="col-span-2"
        />
        <StatTile label="Package uses" value={formatNumber(s.attendedPackageUses)} hint={`attended · ${s.packageUses} booked`} />
        <StatTile label="Different packages" value={formatNumber(s.uniquePackages)} />
        <StatTile label="Members" value={formatNumber(s.uniqueMembers)} />
        <StatTile label="Drop-ins" value={formatNumber(s.attendedDropIns)} hint={`attended · ${s.dropIns} booked`} />
        <StatTile label="Package session value" value={formatMoney(s.estimatedValue)} hint="Attended uses × price per session" className="col-span-2 xl:col-span-1" />
      </StatGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Uses by package"
          description="How many times each package was used in this coach's sessions."
          table={{
            rows: data.byPackage,
            columns: [
              { key: "name", header: "Package", cell: (r) => r.packageName },
              { key: "category", header: "Type", cell: (r) => (r.category ? segmentLabel(r.category) : "—") },
              { key: "uses", header: "Booked", align: "right", cell: (r) => formatNumber(r.uses), sortValue: (r) => r.uses },
              { key: "attended", header: "Attended", align: "right", cell: (r) => formatNumber(r.attended), sortValue: (r) => r.attended },
              { key: "members", header: "Members", align: "right", cell: (r) => formatNumber(r.members) },
              { key: "value", header: "Value", align: "right", cell: (r) => formatMoney(r.value), sortValue: (r) => r.value },
            ],
          }}
        >
          <BarList
            format={(v) => `${formatNumber(v)} uses`}
            items={data.byPackage.map((p) => ({
              key: p.packageName,
              label: p.packageName,
              value: p.attended,
              display: `${formatNumber(p.attended)} attended`,
              secondary: `of ${p.uses} · ${p.members} members`,
            }))}
            emptyText="No package uses in this period."
          />
        </ChartCard>

        <Card className="gap-3 shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">By member</CardTitle>
            <CardDescription className="text-xs">Select a member to list only their sessions below.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              rows={data.byMember}
              dense
              pageSize={8}
              rowKey={(r) => r.memberId ?? `${r.phone}|${r.memberName}`}
              initialSort={{ key: "uses", dir: "desc" }}
              rowClassName={(r) =>
                (r.memberId ?? `${r.phone}|${r.memberName}`) === memberFilter ? "bg-muted" : undefined
              }
              columns={[
                {
                  key: "name",
                  header: "Member",
                  sortValue: (r) => r.memberName,
                  cell: (r) => {
                    const key = r.memberId ?? `${r.phone}|${r.memberName}`;
                    return (
                      <button
                        type="button"
                        className="text-left font-medium hover:underline cursor-pointer"
                        onClick={() => setMemberFilter(memberFilter === key ? null : key)}
                      >
                        {r.memberName}
                      </button>
                    );
                  },
                },
                { key: "packages", header: "Packages", cell: (r) => <span className="text-muted-foreground">{r.packages.join(", ") || "—"}</span> },
                { key: "uses", header: "Uses", align: "right", sortValue: (r) => r.uses, cell: (r) => formatNumber(r.uses) },
                { key: "attended", header: "Attended", align: "right", sortValue: (r) => r.attended, cell: (r) => formatNumber(r.attended) },
                { key: "dropins", header: "Drop-ins", align: "right", sortValue: (r) => r.dropIns, cell: (r) => formatNumber(r.dropIns) },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 shadow-none">
        <CardHeader className="flex flex-col gap-3 space-y-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">
              Every entry <span className="ml-1 font-normal text-muted-foreground">{formatNumber(entries.length)}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              One row per member per session.
              {selectedMember && (
                <>
                  {" "}Showing {selectedMember.memberName} only.{" "}
                  <button type="button" className="underline cursor-pointer" onClick={() => setMemberFilter(null)}>
                    Show everyone
                  </button>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border p-0.5 text-xs" role="group" aria-label="Entry type">
              {(
                [
                  ["packages", "Package uses"],
                  ["pt", "PT only"],
                  ["dropins", "Drop-ins"],
                  ["all", "All"],
                ] as [EntryFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-sm px-2.5 py-1 cursor-pointer text-muted-foreground",
                    filter === key && "bg-muted font-medium text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button
              variant={attendedOnly ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              aria-pressed={attendedOnly}
              onClick={() => setAttendedOnly((v) => !v)}
            >
              Attended only
            </Button>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="h-8 pl-8 text-xs" />
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.entries.length ? (
            <DataTable columns={entryColumns} rows={entries} rowKey={(r) => r.id} pageSize={25} />
          ) : (
            <EmptyState title="No sessions for this coach in this period" description="Try a wider date range." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
