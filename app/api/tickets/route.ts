import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTicketSchema } from "@/lib/validations";
import { getSLAStatus } from "@/lib/sla";
import { sendTicketConfirmation, sendAssignmentEmail } from "@/lib/email";
import { notifyNewTicket, notifyAssignment } from "@/lib/slack";
import { randomUUID } from "crypto";
import type { Prisma, Status, Severity, IssueType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Try to find logged-in user
    let submitterId: string | null = null;
    try {
      const supabase = createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
        if (dbUser) submitterId = dbUser.id;
      }
    } catch { /* anonymous submission is fine */ }

    // For P1/P2 tickets, auto-assign to the on-call engineer if no assignee supplied
    let autoAssigneeId: string | null = null;
    let autoAssignee: { id: string; name: string; email: string } | null = null;
    if (["P1", "P2"].includes(data.severity)) {
      const onCall = await prisma.user.findFirst({
        where: { isOnCall: true, role: { in: ["ENGINEER", "ADMIN"] } },
        select: { id: true, name: true, email: true },
      });
      if (onCall) {
        autoAssigneeId = onCall.id;
        autoAssignee = onCall;
      }
    }

    const trackingToken = randomUUID();

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.create({
        data: {
          title: data.title,
          description: data.description,
          issueType: data.issueType,
          severity: data.severity,
          submitterName: data.submitterName,
          submitterEmail: data.submitterEmail,
          submitterId,
          customerName: data.customerName,
          dealershipName: data.dealershipName,
          links: data.links ?? [],
          attachmentUrls: data.attachmentUrls ?? [],
          callRecordingUrl: data.callRecordingUrl,
          callMonitorName: data.callMonitorName,
          trackingToken,
          assigneeId: autoAssigneeId,
        },
      });
      await tx.statusHistory.create({
        data: {
          ticketId: t.id,
          fromStatus: null,
          toStatus: "NEW",
          changedById: submitterId,
        },
      });
      return t;
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const ticketUrl = `${appUrl}/tickets/${ticket.id}`;

    // Fire-and-forget notifications
    sendTicketConfirmation({
      to: data.submitterEmail,
      submitterName: data.submitterName,
      shortId: ticket.shortId,
      title: ticket.title,
      severity: ticket.severity,
      trackingToken: ticket.trackingToken,
    });
    notifyNewTicket({
      shortId: ticket.shortId,
      title: ticket.title,
      severity: ticket.severity,
      submitterName: data.submitterName,
      customerName: data.customerName,
      issueType: data.issueType,
      ticketUrl,
    });
    if (autoAssignee) {
      notifyAssignment({
        shortId: ticket.shortId,
        title: ticket.title,
        severity: ticket.severity,
        assigneeName: autoAssignee.name,
        ticketUrl,
      });
      sendAssignmentEmail({
        to: autoAssignee.email,
        assigneeName: autoAssignee.name,
        shortId: ticket.shortId,
        title: ticket.title,
        severity: ticket.severity,
        ticketUrl,
      });
    }

    return NextResponse.json({
      id: ticket.id,
      shortId: ticket.shortId,
      trackingToken: ticket.trackingToken,
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || !["ENGINEER", "ADMIN", "OPERATOR"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "25"));
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    const statusParam = searchParams.get("status");
    if (statusParam) {
      const statuses = statusParam.split(",") as Status[];
      where.status = { in: statuses };
    }

    const severityParam = searchParams.get("severity");
    if (severityParam) {
      const severities = severityParam.split(",") as Severity[];
      where.severity = { in: severities };
    }

    const typeParam = searchParams.get("type");
    if (typeParam) {
      const types = typeParam.split(",") as IssueType[];
      where.issueType = { in: types };
    }

    const priorityParam = searchParams.get("priority");
    if (priorityParam) {
      where.priority = { in: priorityParam.split(",") as ("URGENT" | "HIGH" | "MEDIUM" | "LOW")[] };
    }

    const assigneeParam = searchParams.get("assigneeId");
    if (assigneeParam === "unassigned") {
      where.assigneeId = null;
    } else if (assigneeParam) {
      where.assigneeId = assigneeParam;
    }

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { dealershipName: { contains: search, mode: "insensitive" } },
        { submitterName: { contains: search, mode: "insensitive" } },
      ];
    }

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const ticketsWithSLA = tickets.map((t) => {
      const slaStatus = getSLAStatus(t.severity, t.createdAt, t.firstResponseAt);
      return {
        ...t,
        isSLABreached: slaStatus === "breached",
        isSLAAtRisk: slaStatus === "at_risk",
      };
    });

    return NextResponse.json({
      tickets: ticketsWithSLA,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
