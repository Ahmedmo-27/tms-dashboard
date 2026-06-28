"use client";

import { useEffect, useState } from "react";
import { Ticket, TicketStatus, updateTicketStatus } from "@/lib/data/tickets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  NotebookPen,
  Pencil,
  Save,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getCreatorBranchLabel,
  getCreatorDisplayName,
  getCreatorRole,
  getCreatorRoleLabel,
} from "@/lib/utils/ticket-utils";

const STATUS_META: Record<
  TicketStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
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

export interface TicketDetailModalProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  canUpdate?: boolean;
  updateTicketStatusFn?: typeof updateTicketStatus;
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
  onUpdated,
  canUpdate = true,
  updateTicketStatusFn = updateTicketStatus,
}: TicketDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftNotes, setDraftNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset state whenever the modal opens with a ticket
  useEffect(() => {
    if (open && ticket) {
      setDraftNotes(ticket.adminNotes ?? "");
      setIsEditing(false);
    }
  }, [open, ticket]);

  if (!ticket) return null;

  const meta = STATUS_META[ticket.status] ?? STATUS_META.pending;
  const problemText =
    ticket.category === "Other" && ticket.otherDetails
      ? `Other: ${ticket.otherDetails}`
      : ticket.category;

  const hasNotes = !!ticket.adminNotes?.trim();

  const handleEdit = () => {
    setDraftNotes(ticket.adminNotes ?? "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftNotes(ticket.adminNotes ?? "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTicketStatusFn(ticket._id, ticket.status, draftNotes.trim());
      // Reflect saved value immediately so view mode shows updated text
      ticket.adminNotes = draftNotes.trim();
      toast.success("Notes saved");
      setIsEditing(false);
      onUpdated?.();
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const creatorBranch = getCreatorBranchLabel(ticket);

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
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Submitted By
            </p>
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Creator"
              value={getCreatorDisplayName(ticket)}
            />
            <InfoRow
              icon={<Tag className="h-4 w-4" />}
              label="Role"
              value={getCreatorRoleLabel(getCreatorRole(ticket))}
            />
            {creatorBranch && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Branch"
                value={creatorBranch}
              />
            )}
          </div>

          {/* Contact info */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact Info
            </p>
            <InfoRow icon={<User className="h-4 w-4" />} label="Name" value={ticket.name} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={ticket.phone} />
            {ticket.email && (
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={ticket.email} />
            )}
          </div>

          {/* Ticket info */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ticket Details
            </p>
            <InfoRow icon={<Tag className="h-4 w-4" />} label="Problem Category" value={problemText} />
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
                <span className="italic text-muted-foreground">No description provided.</span>
              )}
            </p>
          </div>

          {/* Admin Notes */}
          {canUpdate ? (
          <div className="rounded-lg border border-slate-600 bg-slate-700 p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <NotebookPen className="h-3.5 w-3.5" />
                Admin Notes
              </div>

              {/* Edit / Cancel button — only show when not saving */}
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-7 gap-1.5 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600"
                >
                  <Pencil className="h-3 w-3" />
                  {hasNotes ? "Edit" : "Add Note"}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="h-7 gap-1.5 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              )}
            </div>

            {/* View mode — show existing note as white text */}
            {!isEditing && (
              <p
                className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
                  hasNotes ? "text-white" : "italic text-slate-400"
                }`}
              >
                {hasNotes ? ticket.adminNotes : "No notes yet. Click 'Add Note' to write one."}
              </p>
            )}

            {/* Edit mode — grey textarea + Save button */}
            {isEditing && (
              <div className="space-y-3">
                <Textarea
                  id="admin-notes-textarea"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Write internal notes about this ticket…"
                  className="min-h-[110px] resize-y border-slate-500 bg-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-slate-400"
                  disabled={isSaving}
                  autoFocus
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    {draftNotes.length > 0
                      ? `${draftNotes.length} character${draftNotes.length !== 1 ? "s" : ""}`
                      : ""}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-1.5 bg-white text-slate-800 hover:bg-slate-100"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {isSaving ? "Saving…" : "Save Notes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          ) : hasNotes ? (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <NotebookPen className="h-3.5 w-3.5" />
                Admin Notes
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {ticket.adminNotes}
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
