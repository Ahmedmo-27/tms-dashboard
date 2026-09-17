"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DataTable, type DataColumn } from "./data-table";

type ChartCardProps<T> = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  /** Every chart has a table view so no value depends on reading color alone. */
  table?: { columns: DataColumn<T>[]; rows: T[] };
  className?: string;
};

export function ChartCard<T>({ title, description, children, action, table, className }: ChartCardProps<T>) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <Card className={cn("gap-3 shadow-none", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {action}
          {table && (
            <div className="flex rounded-md border p-0.5" role="group" aria-label="Chart or table view">
              {(["chart", "table"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  aria-pressed={view === mode}
                  title={mode === "chart" ? "Chart view" : "Table view"}
                  className={cn(
                    "flex h-6 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors cursor-pointer",
                    view === mode && "bg-muted text-foreground",
                  )}
                >
                  {mode === "chart" ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {view === "table" && table ? (
          <DataTable columns={table.columns} rows={table.rows} pageSize={8} dense />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
