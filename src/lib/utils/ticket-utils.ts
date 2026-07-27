import type { CreatorRole, Ticket } from "@/lib/data/tickets";
import { getBranchLabel } from "@/lib/utils/location-label";

const ROLE_LABELS: Record<string, string> = {
  member: "Member",
  coach: "Coach",
  branch_admin: "Branch Admin",
  management: "Management",
};

export function getCreatorRoleLabel(role?: string): string {
  if (!role) return "Member";
  return ROLE_LABELS[role] ?? role;
}

export function getCreatorDisplayName(ticket: Ticket): string {
  return ticket.creatorName ?? ticket.name ?? "Unknown";
}

export function getCreatorRole(ticket: Ticket): string {
  return ticket.creatorRole ?? "member";
}

export function getCreatorBranchLabel(ticket: Ticket): string | null {
  if (getCreatorRole(ticket) !== "branch_admin") return null;
  return getBranchLabel(ticket.locationId) ?? ticket.branchLabel ?? null;
}

export function formatHandlerAttribution(
  name?: string,
  role?: string,
  at?: string
): string | null {
  if (!name && !role) return null;
  const who = role
    ? `${name ?? "Unknown"} (${getCreatorRoleLabel(role)})`
    : (name ?? "Unknown");
  if (!at) return who;
  return `${who} · ${new Date(at).toLocaleString()}`;
}

export type { CreatorRole };
