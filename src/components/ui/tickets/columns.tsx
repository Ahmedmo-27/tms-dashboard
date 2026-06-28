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
import {
  getCreatorBranchLabel,
  getCreatorDisplayName,
  getCreatorRole,
  getCreatorRoleLabel,
  formatHandlerAttribution,
} from "@/lib/utils/ticket-utils";

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

const ROLE_BADGE_CLASS: Record<string, string> = {
  member: "bg-slate-100 text-slate-700 border-slate-200",
  coach: "bg-purple-100 text-purple-800 border-purple-200",
  branch_admin: "bg-orange-100 text-orange-800 border-orange-200",
  management: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

function StatusCell({ ticket }: { ticket: Ticket }) {
  const meta = STATUS_META[ticket.status] ?? STATUS_META.pending;
  const attribution = formatHandlerAttribution(
    ticket.statusUpdatedByName,
    ticket.statusUpdatedByRole,
    ticket.statusUpdatedAt
  );

  return (
    <div className="min-w-[120px] space-y-1">
      <Badge className={meta.className}>{meta.label}</Badge>
      {attribution && (
        <p className="text-[11px] text-muted-foreground leading-snug">
          By {attribution}
        </p>
      )}
    </div>
  );
}

function CreatorCell({ ticket }: { ticket: Ticket }) {
  const role = getCreatorRole(ticket);
  const branchLabel = getCreatorBranchLabel(ticket);

  return (
    <div className="min-w-[140px] space-y-1">
      <p className="text-sm font-medium">{getCreatorDisplayName(ticket)}</p>
      <Badge
        variant="outline"
        className={ROLE_BADGE_CLASS[role] ?? ROLE_BADGE_CLASS.member}
      >
        {getCreatorRoleLabel(role)}
      </Badge>
      {branchLabel && (
        <p className="text-xs text-muted-foreground">{branchLabel}</p>
      )}
    </div>
  );
}

function TicketActions({
  ticket,
  onChanged,
  onViewDetails,
  canUpdate = true,
  updateTicketStatusFn = updateTicketStatus,
}: {
  ticket: Ticket;
  onChanged: () => void;
  onViewDetails: (ticket: Ticket) => void;
  canUpdate?: boolean;
  updateTicketStatusFn?: typeof updateTicketStatus;
}) {
  const setStatus = async (status: TicketStatus) => {
    try {
      await updateTicketStatusFn(ticket._id, status);
      toast.success(`Marked as ${STATUS_META[status].label}`);
      onChanged();
    } catch {
      toast.error("Failed to update ticket");
    }
  };

  if (!canUpdate) {
    return (
      <Button variant="ghost" size="sm" onClick={() => onViewDetails(ticket)}>
        <Eye className="h-4 w-4" />
      </Button>
    );
  }

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

export function TicketColumnsWrapper({
  onChanged,
  showBranch = true,
  canUpdateTicket,
  updateTicketStatusFn = updateTicketStatus,
}: {
  onChanged: () => void;
  showBranch?: boolean;
  canUpdateTicket?: (ticket: Ticket) => boolean;
  updateTicketStatusFn?: typeof updateTicketStatus;
}) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const columns = createColumns(
    onChanged,
    openModal,
    showBranch,
    canUpdateTicket,
    updateTicketStatusFn
  );

  return {
    columns,
    modal: (
      <TicketDetailModal
        ticket={selectedTicket}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdated={onChanged}
        canUpdate={
          selectedTicket
            ? canUpdateTicket
              ? canUpdateTicket(selectedTicket)
              : true
            : false
        }
        updateTicketStatusFn={updateTicketStatusFn}
      />
    ),
  };
}

export function createColumns(
  onChanged: () => void,
  onViewDetails: (ticket: Ticket) => void = () => {},
  showBranch = true,
  canUpdateTicket?: (ticket: Ticket) => boolean,
  updateTicketStatusFn: typeof updateTicketStatus = updateTicketStatus
): ColumnDef<Ticket>[] {
  const columns: ColumnDef<Ticket>[] = [
    ...createBranchColumn<Ticket>(showBranch, (ticket) => ticket.branchLabel),
    {
      id: "createdBy",
      header: "Created By",
      cell: ({ row }) => <CreatorCell ticket={row.original} />,
    },
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
      cell: ({ row }) => <StatusCell ticket={row.original} />,
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
          canUpdate={canUpdateTicket ? canUpdateTicket(row.original) : true}
          updateTicketStatusFn={updateTicketStatusFn}
        />
      ),
    },
  ];

  return columns;
}
