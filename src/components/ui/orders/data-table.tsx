"use client"

import React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getExpandedRowModel,
  ExpandedState,
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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Order } from "./columns"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    state: {
      sorting,
      expanded,
    },
  })

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()

                return (
                  <TableHead
                    key={header.id}
                    className="bg-muted/30 font-semibold text-foreground h-12 px-4"
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center space-x-2">
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {canSort && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-muted"
                            onClick={() => header.column.toggleSorting()}
                          >
                            {sorted === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <React.Fragment key={row.id}>
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/30 transition-colors border-b cursor-pointer"
                  style={{
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'
                  }}
                  onClick={() => row.toggleExpanded()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-4 px-4"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow key={`${row.id}-expanded`}>
                    <TableCell colSpan={columns.length} className="p-0">
                      <div className="bg-muted/20 border-l-4 border-primary/30">
                        <div className="p-4">
                          <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                            Order Items
                          </h4>
                          <div className="space-y-2">
                            {
                            (row.original as Order).items.map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="flex items-center justify-between p-3 bg-card rounded-lg border"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{item.item}</p>
                                  <p className="text-sm text-muted-foreground">{item.brand}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    Barcode: {item.barcode}
                                  </p>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="text-center">
                                    <p className="text-muted-foreground">Qty</p>
                                    <p className="font-medium">{item.quantity}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-muted-foreground">Price</p>
                                    <p className="font-medium">${item.price.toFixed(2)}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-muted-foreground">Total</p>
                                    <p className="font-semibold text-primary">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
