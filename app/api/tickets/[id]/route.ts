import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateTicketSchema } from "@/lib/validations";
import { getSLAStatus } from "@/lib/sla";
import { sendStatusUpdateEmail, sendAssignmentEmail } from "@/lib/email";
import { notifyStatusChange, notifyAssignment } from "@/lib/slack";
import { createLinearIssue } from "@/lib/linear";
import { canViewTicket, canManageTickets } from "@/lib/ticket-access";
import type { Status } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const canSeeInternal = canManageTickets(dbUser.role);

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { id: true, name: true } },
        submitter: { select: { id: true, name: true, email: true } },
        comments: {
          where: canSeeInternal ? {} : { isInternal: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { role: true } },
          },
        },
        history: {
          orderBy: { changedAt: "desc" },
          include: {
            changedBy: { select: { name: true } },
          },
        },
      },
    });

    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canViewTicket(dbUser, ticket)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const slaStatus = getSLAStatus(ticket.severity, ticket.createdAt, ticket.firstResponseAt);

    return NextResponse.json({
      ...ticket,
      isSLABreached: slaStatus === "breached",
      isSLAAtRisk: slaStatus === "at_risk",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || !canManageTickets(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;

    const existing = await prisma.ticket.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const updateData: Record<string, unknown> = { ...data };

    if (data.status && data.status !== existing.status) {
      const prev = existing.status;
      const next = data.status as Status;

      if (next === "TRIAGED" && !existing.triagedAt) updateData.triagedAt = now;
      if (["TRIAGED", "IN_PROGRESS", "BLOCKED"].includes(next) && !existing.firstResponseAt)
        updateData.firstResponseAt = now;
      if (next === "RESOLVED") updateData.resolvedAt = now;
      if (next === "CLOSED") updateData.closedAt = now;
      if (
        ["RESOLVED", "CLOSED"].includes(prev) &&
        !["RESOLVED", "CLOSED"].includes(next)
      )
        updateData.reopenedAt = now;
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: params.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: updateData as any,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      if (data.status && data.status !== existing.status) {
        await tx.statusHistory.create({
          data: {
            ticketId: params.id,
            fromStatus: existing.status,
            toStatus: data.status,
            changedById: dbUser.id,
          },
        });
      }

      return updated;
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const ticketUrl = `${appUrl}/tickets/${params.id}`;

    // Status change notifications
    if (data.status && data.status !== existing.status) {
      sendStatusUpdateEmail({
        to: existing.submitterEmail,
        submitterName: existing.submitterName,
        shortId: existing.shortId,
        title: existing.title,
        newStatus: data.status,
      });
      notifyStatusChange({
        shortId: existing.shortId,
        title: existing.title,
        severity: existing.severity,
        newStatus: data.status,
        changedByName: dbUser.name,
        ticketUrl,
      });
    }

    // Assignment notifications
    const assigneeChanged =
      data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId;
    if (assigneeChanged && ticket.assignee) {
      notifyAssignment({
        shortId: existing.shortId,
        title: existing.title,
        severity: existing.severity,
        assigneeName: ticket.assignee.name,
        ticketUrl,
      });
      sendAssignmentEmail({
        to: ticket.assignee.email,
        assigneeName: ticket.assignee.name,
        shortId: existing.shortId,
        title: existing.title,
        severity: existing.severity,
        ticketUrl,
      });
    }

    // Linear sync on triage
    const triagedNow =
      data.status === "TRIAGED" &&
      existing.status !== "TRIAGED" &&
      !existing.linearIssueId;

    if (triagedNow) {
      const linearIssue = await createLinearIssue({
        title: existing.title,
        description: existing.description,
        ticketUrl,
        shortId: existing.shortId,
        severity: existing.severity,
      });
      if (linearIssue) {
        await prisma.ticket.update({
          where: { id: params.id },
          data: {
            linearIssueId: linearIssue.id,
            linearIssueKey: linearIssue.identifier,
            linearIssueUrl: linearIssue.url,
          },
        });
        ticket.linearIssueId = linearIssue.id;
        ticket.linearIssueKey = linearIssue.identifier;
      }
    }

    return NextResponse.json(ticket);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.ticket.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
