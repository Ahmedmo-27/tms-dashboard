"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

export type DataColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Enables sorting on this column. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: "left" | "right";
  className?: string;
};

type DataTableProps<T> = {
  columns: DataColumn<T>[];
  rows: T[];
  pageSize?: number;
  dense?: boolean;
  emptyText?: string;
  rowKey?: (row: T, index: number) => string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  /** Server-side paging: when set, rows are already one page. */
  serverPaging?: { page: number; totalPages: number; total: number; pageSize: number; onPageChange: (page: number) => void };
  rowClassName?: (row: T) => string | undefined;
  /** Turns each row into an accordion: clicking it reveals `render` underneath. */
  expandable?: {
    isExpanded: (row: T) => boolean;
    onToggle: (row: T) => void;
    render: (row: T) => ReactNode;
    label?: (row: T) => string;
  };
};

export function DataTable<T>({
  columns,
  rows,
  pageSize = 10,
  dense,
  emptyText = "Nothing to show for this period.",
  rowKey,
  initialSort,
  serverPaging,
  rowClassName,
  expandable,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort || serverPaging) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv))) * factor;
    });
  }, [rows, sort, columns, serverPaging]);

  const pageCount = serverPaging ? serverPaging.totalPages : Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = serverPaging ? sorted : sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((current) =>
      current?.key === key
        ? { key, dir: current.dir === "desc" ? "asc" : "desc" }
        : { key, dir: "desc" },
    );
  };

  return (
    <div className="min-w-0">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              {expandable && <TableHead className="w-8" aria-label="Expand" />}
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const SortIcon = !active ? ArrowUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
                return (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "whitespace-nowrap text-xs font-medium",
                      column.align === "right" && "text-right",
                      column.className,
                    )}
                  >
                    {column.sortValue && !serverPaging ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 cursor-pointer hover:text-foreground",
                          column.align === "right" && "flex-row-reverse",
                          active && "text-foreground",
                        )}
                      >
                        {column.header}
                        <SortIcon className={cn("h-3 w-3", !active && "opacity-40")} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (expandable ? 1 : 0)}
                  className="h-24 text-center text-xs text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row, i) => {
                const key = rowKey ? rowKey(row, i) : String(i);
                const expanded = expandable ? expandable.isExpanded(row) : false;
                const cells = columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      "text-xs sm:text-sm",
                      dense ? "py-1.5" : "py-2.5",
                      column.align === "right" && "text-right tabular-nums",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ));
                if (!expandable) {
                  return (
                    <TableRow key={key} className={rowClassName?.(row)}>
                      {cells}
                    </TableRow>
                  );
                }
                return (
                  <Fragment key={key}>
                    <TableRow
                      className={cn("cursor-pointer", expanded && "bg-muted/30", rowClassName?.(row))}
                      onClick={() => expandable.onToggle(row)}
                    >
                      <TableCell className={cn("w-8 pr-0", dense ? "py-1.5" : "py-2.5")}>
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-label={expandable.label?.(row) ?? "Show details"}
                          onClick={(event) => {
                            event.stopPropagation();
                            expandable.onToggle(row);
                          }}
                          className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
                        </button>
                      </TableCell>
                      {cells}
                    </TableRow>
                    {expanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columns.length + 1} className="bg-muted/20 p-0">
                          {expandable.render(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {serverPaging ? (
        <TablePagination
          pageIndex={serverPaging.page - 1}
          pageCount={serverPaging.totalPages}
          total={serverPaging.total}
          pageSize={serverPaging.pageSize}
          onPageChange={(index) => serverPaging.onPageChange(index + 1)}
        />
      ) : (
        <TablePagination
          pageIndex={safePage}
          pageCount={pageCount}
          total={sorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
