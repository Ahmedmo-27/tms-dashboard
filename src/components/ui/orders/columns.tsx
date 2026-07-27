import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../button";
import { Badge } from "../badge";
import { format } from "date-fns";
import { createBranchColumn } from "../branch-column";

export interface OrderItem {
  barcode: string;
  item: string;
  brand: string;
  quantity: number;
  price: number;
}

export interface Order {
  items: OrderItem[];
  total: number;
  date: Date;
  branchLabel?: string;
}

export function createColumns(showBranch = false): ColumnDef<Order>[] {
  return [
    ...createBranchColumn<Order>(showBranch, (order) => order.branchLabel),
  {
    id: "expander",
    header: "",
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 pointer-events-none"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
        <div className="flex flex-col min-w-[120px]">
          <span className="font-medium">
            {format(new Date(row.original.date), "MMM dd, yyyy")}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.date), "hh:mm a")}
          </span>
        </div>    ),
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.original.items.length} item{row.original.items.length !== 1 ? 's' : ''}
      </Badge>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-semibold text-primary">
        ${row.original.total.toFixed(2)}
      </span>
    ),
  },
];
}
