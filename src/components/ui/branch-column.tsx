import { ColumnDef } from "@tanstack/react-table";
import { BranchPill } from "@/components/ui/branch-pill";

export function createBranchColumn<T>(
  show: boolean,
  getLabel: (row: T) => string | null | undefined
): ColumnDef<T>[] {
  if (!show) return [];

  return [
    {
      id: "branch",
      header: "Branch",
      cell: ({ row }) => {
        const label = getLabel(row.original);
        return label ? (
          <BranchPill label={label} />
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
  ];
}

export function prependBranchColumn<T>(
  columns: ColumnDef<T>[],
  show: boolean,
  getLabel: (row: T) => string | null | undefined
): ColumnDef<T>[] {
  return [...createBranchColumn(show, getLabel), ...columns];
}
