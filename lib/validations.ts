import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  issueType: z.enum(["BUG", "CALL_FAILURE", "CUSTOMER_ISSUE", "INTEGRATION", "OPS_REQUEST"]),
  severity: z.enum(["P1", "P2", "P3", "P4"]),
  submitterName: z.string().min(1),
  submitterEmail: z.string().email(),
  customerName: z.string().optional(),
  dealershipName: z.string().optional(),
  links: z.array(z.string().url()).optional(),
  attachmentUrls: z.array(z.string().url()).optional(),
  callRecordingUrl: z.string().url().optional().or(z.literal("")),
  callMonitorName: z.string().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).optional(),
  issueType: z.enum(["BUG", "CALL_FAILURE", "CUSTOMER_ISSUE", "INTEGRATION", "OPS_REQUEST"]).optional(),
  severity: z.enum(["P1", "P2", "P3", "P4"]).optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  status: z.enum(["NEW", "TRIAGED", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"]).optional(),
  assigneeId: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  dealershipName: z.string().nullable().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1),
  isInternal: z.boolean().default(false),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["SUBMITTER", "OPERATOR", "ENGINEER", "ADMIN"]).optional(),
  isOnCall: z.boolean().optional(),
}).refine((data) => data.role !== undefined || data.isOnCall !== undefined, {
  message: "Provide role or isOnCall",
});

export const inviteUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["SUBMITTER", "OPERATOR", "ENGINEER", "ADMIN"]),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
