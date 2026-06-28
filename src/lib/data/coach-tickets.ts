import type { AxiosInstance } from "axios";
import type { Ticket, TicketCategory, TicketStatus } from "@/lib/data/tickets";
import { getBranchLabel } from "@/lib/utils/location-label";

const mapTicket = (ticket: Ticket): Ticket => ({
  ...ticket,
  branchLabel: getBranchLabel(ticket.locationId) ?? undefined,
  createdBy:
    typeof ticket.createdBy === "object" && ticket.createdBy !== null
      ? ticket.createdBy._id ?? ticket.createdBy
      : ticket.createdBy,
});

export const getCoachTickets = async (
  api: AxiosInstance,
  status: string | undefined,
  search: string | undefined | null,
  page: number,
  limit: number
) => {
  const params: Record<string, string | number> = { page, limit };
  if (status && status !== "all") params.status = status;
  if (search?.trim()) params.search = search.trim();

  const response = await api.get("/api/coach/tickets", { params });
  const rawTickets = response.data.data.tickets as Ticket[];
  return {
    data: rawTickets.map(mapTicket),
    total: response.data.data.total as number,
  };
};

export const getCoachTicketCategories = async (
  api: AxiosInstance
): Promise<TicketCategory[]> => {
  const response = await api.get("/api/coach/ticket-categories");
  return response.data.data as TicketCategory[];
};

export const submitCoachTicket = async (
  api: AxiosInstance,
  payload: {
    category: string;
    description: string;
    otherDetails?: string;
  }
) => {
  const response = await api.post("/api/coach/tickets", payload);
  return response.data.data;
};

export const updateCoachTicketStatus = async (
  api: AxiosInstance,
  id: string,
  status: TicketStatus,
  adminNotes?: string
) => {
  const response = await api.patch(`/api/coach/tickets/${id}`, {
    status,
    ...(adminNotes !== undefined ? { adminNotes } : {}),
  });
  return response.data.data as Ticket;
};
