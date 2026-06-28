"use client";

import { useState } from "react";
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
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { TicketDetailModal } from "./ticket-detail-modal";
import { createBranchColumn } from "../branch-column";

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
  onViewDetails,
}: {
  ticket: Ticket;
  onChanged: () => void;
  onViewDetails: (ticket: Ticket) => void;
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
        <DropdownMenuItem onClick={() => onViewDetails(ticket)}>
          <Eye className="h-4 w-4" /> View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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

// Wrapper that owns modal state so columns can stay as a pure factory
export function TicketColumnsWrapper({
  onChanged,
  showBranch = false,
}: {
  onChanged: () => void;
  showBranch?: boolean;
}) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const columns = createColumns(onChanged, openModal, showBranch);

  return { columns, modal: (
    <TicketDetailModal
      ticket={selectedTicket}
      open={modalOpen}
      onOpenChange={setModalOpen}
      onUpdated={onChanged}
    />
  )};
}

export function createColumns(
  onChanged: () => void,
  onViewDetails: (ticket: Ticket) => void = () => {},
  showBranch = false
): ColumnDef<Ticket>[] {
  return [
    ...createBranchColumn<Ticket>(showBranch, (ticket) => ticket.branchLabel),
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
      cell: ({ row }) => {
        const desc = row.original.description;
        return (
          <button
            onClick={() => onViewDetails(row.original)}
            title="Click to view full description"
            className="block max-w-[240px] truncate text-left text-muted-foreground transition-colors hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {desc || <span className="italic">No description</span>}
          </button>
        );
      },
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
        <TicketActions
          ticket={row.original}
          onChanged={onChanged}
          onViewDetails={onViewDetails}
        />
      ),
    },
  ];
}
