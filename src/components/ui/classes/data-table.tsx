"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { MobileClassCard } from "./mobile-class-card"
import { Class } from "./columns"
import { Package } from "../packages/columns"
import type { Location } from "@/lib/data/locations"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  packages?: Package[]
  classCategories?: string[]
  locations?: Location[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  packages = [],
  classCategories = [],
  locations = [],
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  })

  if (isLoading) {
    return (
      <>
        <div className="block md:hidden">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="hidden md:block w-full overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-3 border-b last:border-0">
                {Array.from({ length: columns.length }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-[120px] bg-muted/60" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  const filteredRows = table.getFilteredRowModel().rows

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search classes..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden">
        {filteredRows.length > 0 ? (
          <div className="space-y-3">
            {filteredRows.map((row) => (
              <MobileClassCard
                key={(row.original as Class)._id}
                cls={row.original as Class}
                packages={packages}
                classCategories={classCategories}
                locations={locations}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              No classes found
            </p>
            <p className="text-xs text-muted-foreground/80">
              {globalFilter ? "Try a different search term" : "Create a class to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "group cursor-pointer border-b last:border-0",
                      "transition-colors hover:bg-muted/50 active:bg-muted/70",
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-[300px] text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        No results found
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {globalFilter ? "Try a different search term" : "Try adjusting your filters"}
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
  )
}
