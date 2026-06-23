"use client";

import { Ticket, TicketStatus } from "@/lib/data/tickets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CircleDot,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  Mail,
  Tag,
  FileText,
  Calendar,
} from "lucide-react";

const STATUS_META: Record<TicketStatus, { label: string; icon: React.ReactNode; className: string }> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  in_progress: {
    label: "In Progress",
    icon: <CircleDot className="h-3.5 w-3.5" />,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

interface TicketDetailModalProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function TicketDetailModal({
  ticket,
  open,
  onOpenChange,
}: TicketDetailModalProps) {
  if (!ticket) return null;

  const meta = STATUS_META[ticket.status] ?? STATUS_META.pending;
  const problemText =
    ticket.category === "Other" && ticket.otherDetails
      ? `Other: ${ticket.otherDetails}`
      : ticket.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle className="text-base font-semibold">
              Support Ticket
            </DialogTitle>
            <Badge className={`flex items-center gap-1.5 ${meta.className}`}>
              {meta.icon}
              {meta.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Member info */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Member Info
            </p>
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Name"
              value={ticket.name}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={ticket.phone}
            />
            {ticket.email && (
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={ticket.email}
              />
            )}
          </div>

          {/* Ticket info */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ticket Details
            </p>
            <InfoRow
              icon={<Tag className="h-4 w-4" />}
              label="Problem Category"
              value={problemText}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Submitted"
              value={new Date(ticket.createdAt).toLocaleString()}
            />
          </div>

          {/* Description */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Description
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {ticket.description || (
                <span className="italic text-muted-foreground">
                  No description provided.
                </span>
              )}
            </p>
          </div>

          {/* Admin notes (if any) */}
          {ticket.adminNotes && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Admin Notes
              </p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-blue-900">
                {ticket.adminNotes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
