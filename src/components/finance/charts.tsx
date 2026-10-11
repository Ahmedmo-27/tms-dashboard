"use client";

import type { ReactNode } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatAxisNumber, formatBucket } from "./format";

export type Series = {
  key: string;
  label: string;
  color: string;
  /** "area" = line with a 10% wash, "line" = plain line. */
  kind?: "area" | "line";
};

type Formatter = (value: number) => string;

const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" };

export function Legend({ items, className }: { items: { label: string; color: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function TooltipBox({
  title,
  rows,
}: {
  title: ReactNode;
  rows: { label: string; value: string; color: string }[];
}) {
  return (
    <div className="min-w-[160px] rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-medium">{title}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: row.color }} aria-hidden />
              {row.label}
            </span>
            <span className="font-medium tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Time series: lines/areas over date buckets, with a crosshair tooltip. */
export function TrendChart<T extends { bucket: string }>({
  data,
  series,
  format,
  height = 260,
}: {
  data: T[];
  series: Series[];
  format: Formatter;
  height?: number;
}) {
  return (
    <div className="space-y-3">
      {series.length > 1 && <Legend items={series} />}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
            <XAxis
              dataKey="bucket"
              tickFormatter={(v) => formatBucket(String(v))}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--viz-grid)" }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v) => formatAxisNumber(Number(v))}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeOpacity: 0.4 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={formatBucket(String(label), true)}
                    rows={series.map((s) => {
                      const point = payload.find((p) => p.dataKey === s.key);
                      const value = point?.value;
                      return {
                        label: s.label,
                        color: s.color,
                        value: value === null || value === undefined ? "—" : format(Number(value)),
                      };
                    })}
                  />
                ) : null
              }
            />
            {series.map((s) =>
              s.kind === "line" ? (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                  isAnimationActive={false}
                  connectNulls
                />
              ) : (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                  isAnimationActive={false}
                />
              ),
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Vertical columns over buckets, stacked or grouped. */
export function ColumnChart<T extends Record<string, unknown>>({
  data,
  xKey = "bucket",
  series,
  format,
  stacked = true,
  height = 260,
  xFormatter = (v: string) => formatBucket(v),
}: {
  data: T[];
  xKey?: string;
  series: Series[];
  format: Formatter;
  stacked?: boolean;
  height?: number;
  xFormatter?: (value: string) => string;
}) {
  return (
    <div className="space-y-3">
      {series.length > 1 && <Legend items={series} />}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
            <XAxis
              dataKey={xKey}
              tickFormatter={(v) => xFormatter(String(v))}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--viz-grid)" }}
              minTickGap={16}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => formatAxisNumber(Number(v))}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const rows = series
                  .map((s) => {
                    const point = payload.find((p) => p.dataKey === s.key);
                    const value = Number(point?.value ?? 0);
                    return { label: s.label, color: s.color, raw: value, value: format(value) };
                  })
                  .filter((r) => r.raw !== 0 || series.length <= 3);
                const total = rows.reduce((sum, r) => sum + r.raw, 0);
                return (
                  <TooltipBox
                    title={xKey === "bucket" ? formatBucket(String(label), true) : xFormatter(String(label))}
                    rows={
                      stacked && rows.length > 1
                        ? [...rows, { label: "Total", color: "transparent", raw: total, value: format(total) }]
                        : rows
                    }
                  />
                );
              }}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId={stacked ? "stack" : undefined}
                fill={s.color}
                maxBarSize={24}
                stroke="var(--card)"
                strokeWidth={stacked ? 1 : 0}
                radius={!stacked || i === series.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export type BarListItem = {
  key: string;
  label: ReactNode;
  value: number;
  color?: string;
  /** Text shown at the bar end; defaults to the formatted value. */
  display?: ReactNode;
  secondary?: ReactNode;
};

/** Ranked horizontal bars with labels in text ink; hover shows the full value. */
export function BarList({
  items,
  format,
  max,
  emptyText = "No data for this period.",
}: {
  items: BarListItem[];
  format: Formatter;
  max?: number;
  emptyText?: string;
}) {
  if (!items.length) return <p className="py-8 text-center text-xs text-muted-foreground">{emptyText}</p>;
  const top = max ?? Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const pct = Math.max(0, Math.min(100, (Math.abs(item.value) / top) * 100));
        return (
          <li key={item.key} className="group" title={`${typeof item.label === "string" ? item.label : ""} ${format(item.value)}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-medium text-foreground">{item.label}</span>
              <span className="shrink-0 tabular-nums text-foreground">
                {item.display ?? format(item.value)}
                {item.secondary && <span className="ml-1.5 text-muted-foreground">{item.secondary}</span>}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full transition-[filter] group-hover:brightness-110"
                style={{ width: `${pct}%`, minWidth: item.value ? 4 : 0, background: item.color ?? "var(--viz-1)" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** A single 100% bar split into parts, e.g. payment mix. */
export function ShareBar({ parts, format }: { parts: { key: string; label: string; value: number; color: string }[]; format: Formatter }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  if (!total) return <p className="py-4 text-center text-xs text-muted-foreground">No data for this period.</p>;
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <div
              key={p.key}
              title={`${p.label}: ${format(p.value)} (${((p.value / total) * 100).toFixed(1)}%)`}
              style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
            />
          ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} aria-hidden />
              <span className="truncate">{p.label}</span>
            </span>
            <span className="shrink-0 tabular-nums font-medium">{((p.value / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiny inline trend line for table rows. */
export function Sparkline({ values, color = "var(--viz-1)", width = 96, height = 24 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
