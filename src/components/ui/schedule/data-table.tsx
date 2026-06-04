"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className="flex items-center space-x-4 py-3 border-b last:border-0"
            >
              {Array.from({ length: columns.length }).map((_, j) => (
                <Skeleton 
                  key={j} 
                  className="h-6 w-[80px] bg-muted/60" 
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow 
              key={headerGroup.id} 
              className="hover:bg-transparent border-b border-border/50"
            >
              {headerGroup.headers.map((header) => {
                return (
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
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
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
              <TableCell 
                colSpan={columns.length} 
                className="h-[300px] text-center"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    No results found
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Try adjusting your search or filters
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
