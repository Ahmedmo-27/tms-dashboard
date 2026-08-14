"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileCoachCard } from "./mobile-coach-card";
import { Coach } from "./columns";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  hideSearch?: boolean;
  embedded?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  hideSearch = false,
  embedded = false,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (isLoading) {
    return (
      <>
        <div className="block lg:hidden">
          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 sm:h-32 bg-muted/30 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="hidden lg:block w-full overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 py-3 border-b last:border-0"
              >
                {Array.from({ length: columns.length }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-[120px] bg-muted/60" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  const filteredRows = table.getFilteredRowModel().rows;

  return (
    <>
      {!hideSearch && (
        <div className="mb-4">
          <Input
            placeholder="Search coaches..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="block lg:hidden">
        {filteredRows.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {filteredRows.map((row) => (
              <MobileCoachCard
                key={(row.original as Coach)._id}
                coach={row.original as Coach}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] sm:h-[280px] text-center p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">
              No coaches found
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground/80">
              {globalFilter
                ? "Try a different search term"
                : "Add a coach to get started"}
            </p>
          </div>
        )}
      </div>

      <div
        className={cn(
          "hidden lg:block w-full min-w-0 overflow-hidden",
          embedded ? "rounded-md border" : "rounded-lg border bg-card shadow-sm"
        )}
      >
        <div className="overflow-x-auto -mx-px">
          <Table className="min-w-[520px] w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-b border-border/50"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "bg-muted/30 h-10 px-2 text-xs font-medium text-muted-foreground lg:h-11 lg:px-3 lg:text-sm xl:px-4",
                        "transition-colors hover:bg-muted/50 whitespace-nowrap",
                        "first:rounded-tl-lg last:rounded-tr-lg"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {filteredRows.length ? (
                filteredRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "group border-b last:border-0",
                      "transition-colors hover:bg-muted/50",
                      "data-[state=selected]:bg-muted"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-2 py-2.5 text-xs lg:px-3 lg:py-3 lg:text-sm xl:px-4 align-middle",
                          "group-last:last:rounded-br-lg group-last:first:rounded-bl-lg"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-[280px] text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        No results found
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {globalFilter
                          ? "Try a different search term"
                          : "Add a coach to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
