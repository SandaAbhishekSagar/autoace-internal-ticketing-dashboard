import type { Role } from "@prisma/client";
import { ENGINEER_AND_ABOVE, OPERATOR_AND_ABOVE } from "./auth";

type TicketForAccess = {
  submitterId: string | null;
  submitterEmail: string;
};

export function canManageTickets(role: Role): boolean {
  return ENGINEER_AND_ABOVE.includes(role);
}

export function canViewAllTickets(role: Role): boolean {
  return OPERATOR_AND_ABOVE.includes(role);
}

export function canViewTicket(
  user: { id: string; email: string; role: Role },
  ticket: TicketForAccess
): boolean {
  if (canViewAllTickets(user.role)) return true;
  if (ticket.submitterId && ticket.submitterId === user.id) return true;
  if (ticket.submitterEmail.toLowerCase() === user.email.toLowerCase()) return true;
  return false;
}
