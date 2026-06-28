import { tms } from "@/lib/tms-api";

export type TicketStatus = "pending" | "in_progress" | "resolved" | "rejected";

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
  createdAt: string;
  updatedAt: string;
}

export const getTickets = async (
  status: string | undefined,
  search: string | undefined | null,
  page: number,
  limit: number,
  locationId?: string
) => {
  const params: Record<string, string | number> = { page, limit };
  if (status && status !== "all") params.status = status;
  if (search?.trim()) params.search = search.trim();
  if (locationId) params.locationId = locationId;

  const response = await tms.get("/admin/tickets", { params });
  return {
    data: response.data.data.tickets as Ticket[],
    total: response.data.data.total as number,
  };
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
