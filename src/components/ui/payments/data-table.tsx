"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useEffect, useState } from "react"
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
import { Payment } from "./columns"
import { MobilePaymentCard } from "./mobile-payment-card"
import { CATALOG_PAGE_SIZE, TablePagination } from "@/components/ui/table-pagination"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  isManagement?: boolean
  onEdit?: (payment: Payment) => void
  onDelete?: (payment: Payment) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = CATALOG_PAGE_SIZE,
  isManagement,
  onEdit,
  onDelete,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  })

  // Reset to first page when data or pageSize changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize }))
  }, [data, pageSize])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  })

  const pageRows = table.getRowModel().rows

  return (
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden">
        <div className="space-y-3 p-4">
          {pageRows.map((row) => (
            <MobilePaymentCard
              key={row.id}
              payment={row.original as Payment}
              isManagement={isManagement}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-auto">
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
                      className="bg-muted/30 font-semibold text-foreground h-10 sm:h-12 px-2 sm:px-4 text-xs sm:text-sm"
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
                              className="h-8 w-8 p-0 hover:bg-muted touch-manipulation"
                              onClick={() => header.column.toggleSorting()}
                            >
                              {sorted === "asc" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 opacity-50" />
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
            {pageRows.length ? (
              pageRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/30 transition-colors border-b last:border-b-0 touch-manipulation"
                  style={{
                    backgroundColor: index % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 px-2 sm:py-4 sm:px-4"
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
                  className="h-32 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="border-t px-4 py-3 sm:px-6">
          <TablePagination
            className="pt-0"
            pageIndex={pagination.pageIndex}
            pageCount={table.getPageCount()}
            total={data.length}
            pageSize={pagination.pageSize}
            onPageChange={(pageIndex) =>
              setPagination((prev) => ({ ...prev, pageIndex }))
            }
          />
        </div>
      )}
    </>
  )
}
