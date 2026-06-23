import { ColumnDef } from "@tanstack/react-table";
import { Ticket, TicketStatus, updateTicketStatus } from "@/lib/data/tickets";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import {
  MoreHorizontal,
  Clock,
  CircleDot,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_META: Record<TicketStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

function TicketActions({
  ticket,
  onChanged,
}: {
  ticket: Ticket;
  onChanged: () => void;
}) {
  const setStatus = async (status: TicketStatus) => {
    try {
      await updateTicketStatus(ticket._id, status);
      toast.success(`Marked as ${STATUS_META[status].label}`);
      onChanged();
    } catch {
      toast.error("Failed to update ticket");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Set status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setStatus("in_progress")}>
          <CircleDot className="h-4 w-4" /> In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setStatus("resolved")}>
          <CheckCircle2 className="h-4 w-4" /> Resolve
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => setStatus("rejected")}>
          <XCircle className="h-4 w-4" /> Reject
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setStatus("pending")}>
          <Clock className="h-4 w-4" /> Reset to Pending
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createColumns(onChanged: () => void): ColumnDef<Ticket>[] {
  return [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "category",
      header: "Problem",
      cell: ({ row }) => {
        const t = row.original;
        const text =
          t.category === "Other" && t.otherDetails
            ? `Other: ${t.otherDetails}`
            : t.category;
        return (
          <span title={text} className="block max-w-[160px] truncate">
            {text}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span
          title={row.original.description}
          className="block max-w-[240px] truncate text-muted-foreground"
        >
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <TicketActions ticket={row.original} onChanged={onChanged} />
      ),
    },
  ];
}
