import type { Role, IssueType, Severity, Priority, Status } from "@prisma/client";

export type { Role, IssueType, Severity, Priority, Status };

export interface UserProfile {
  id: string;
  supabaseId: string | null;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface TicketSummary {
  id: string;
  shortId: number;
  title: string;
  issueType: IssueType;
  severity: Severity;
  priority: Priority;
  status: Status;
  submitterName: string;
  submitterEmail: string;
  customerName: string | null;
  dealershipName: string | null;
  assignee: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  firstResponseAt: Date | null;
  _count?: { comments: number };
  isSLABreached?: boolean;
  isSLAAtRisk?: boolean;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  links: string[];
  attachmentUrls: string[];
  submitter: { id: string; name: string; email: string } | null;
  triagedAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  reopenedAt: Date | null;
  trackingToken: string | null;
  callRecordingUrl: string | null;
  callMonitorName: string | null;
  comments: CommentItem[];
  history: StatusHistoryItem[];
}

export interface CommentItem {
  id: string;
  ticketId: string;
  authorId: string | null;
  authorName: string;
  author: { role: Role } | null;
  body: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface StatusHistoryItem {
  id: string;
  fromStatus: Status | null;
  toStatus: Status;
  changedBy: { name: string } | null;
  changedAt: Date;
  note: string | null;
}

export interface KPIData {
  openCount: number;
  criticalOpenCount: number;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
  avgTimeToTriageHours: number | null;
  slaBreachCount: number;
  slaBreachRate: number;
  reopenRate: number;
  byType: { type: IssueType; count: number }[];
  byStatus: { status: Status; count: number }[];
  bySeverity: { severity: Severity; count: number }[];
  dailyCreated: { date: string; count: number }[];
  byEngineer: {
    name: string;
    assigned: number;
    resolved: number;
    openCritical: number;
    avgResolveHours: number | null;
  }[];
  byCustomer: {
    name: string;
    total: number;
    open: number;
    critical: number;
    avgResolveHours: number | null;
  }[];
}

export interface PaginatedTickets {
  tickets: TicketSummary[];
  total: number;
  page: number;
  pages: number;
}
