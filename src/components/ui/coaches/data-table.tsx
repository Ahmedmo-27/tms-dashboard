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
import { Coach } from "./columns";
import EditCoachDialog from "../dialogs/coach/edit-coach";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
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

  const filteredRows = table.getFilteredRowModel().rows;

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search coaches..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Mobile list view */}
      <div className="block md:hidden">
        {filteredRows.length > 0 ? (
          <div className="space-y-3">
            {filteredRows.map((row) => {
              const coach = row.original as Coach;
              return (
                <div
                  key={coach._id}
                  className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-sm">{coach.coachName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {coach.phoneNumber}
                    </p>
                  </div>
                  <EditCoachDialog coach={coach} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              No coaches found
            </p>
            <p className="text-xs text-muted-foreground/80">
              {globalFilter
                ? "Try a different search term"
                : "Add a coach to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block w-full overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
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
                        "bg-muted/30 h-12 px-4 text-sm font-medium text-muted-foreground",
                        "transition-colors hover:bg-muted/50",
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
                          "px-4 py-3 text-sm",
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
                    className="h-[300px] text-center"
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
