import { tms } from "@/lib/tms-api";
import { getBranchLabel } from "@/lib/utils/location-label";

export type TicketStatus = "pending" | "in_progress" | "resolved" | "rejected";

export type CreatorRole = "member" | "coach" | "branch_admin" | "management";

export interface Ticket {
  _id: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  otherDetails?: string;
  description: string;
  status: TicketStatus;
  adminNotes?: string;
  handledByName?: string;
  handledByRole?: string;
  statusUpdatedByName?: string;
  statusUpdatedByRole?: string;
  statusUpdatedAt?: string;
  notesUpdatedByName?: string;
  notesUpdatedByRole?: string;
  notesUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  branchLabel?: string;
  locationId?: { branchName?: string; location?: string } | string;
  createdBy?: string | { _id?: string; name?: string; role?: string };
  creatorRole?: CreatorRole | string;
  creatorName?: string;
}

export interface TicketCategory {
  _id: string;
  name: string;
  isActive?: boolean;
}

const mapTicket = (ticket: Ticket): Ticket => ({
  ...ticket,
  branchLabel: getBranchLabel(ticket.locationId) ?? undefined,
  createdBy:
    typeof ticket.createdBy === "object" && ticket.createdBy !== null
      ? ticket.createdBy._id ?? ticket.createdBy
      : ticket.createdBy,
});

export const getTickets = async (
  status: string | undefined,
  search: string | undefined | null,
  page: number,
  limit: number
) => {
  const params: Record<string, string | number> = { page, limit };
  if (status && status !== "all") params.status = status;
  if (search?.trim()) params.search = search.trim();

  const response = await tms.get("/admin/tickets", { params });
  const rawTickets = response.data.data.tickets as Ticket[];
  return {
    data: rawTickets.map(mapTicket),
    total: response.data.data.total as number,
  };
};

export const getTicketCategories = async (): Promise<TicketCategory[]> => {
  const response = await tms.get("/admin/ticket-categories");
  return response.data.data as TicketCategory[];
};

export const submitTicket = async (payload: {
  category: string;
  description: string;
  otherDetails?: string;
}) => {
  const response = await tms.post("/admin/tickets", payload);
  return response.data.data;
};

export const updateTicketStatus = async (
  id: string,
  status: TicketStatus,
  adminNotes?: string
) => {
  const response = await tms.patch(`/admin/tickets/${id}`, {
    status,
    ...(adminNotes !== undefined ? { adminNotes } : {}),
  });
  return response.data.data as Ticket;
};
