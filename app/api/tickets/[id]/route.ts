import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateTicketSchema } from "@/lib/validations";
import { getSLAStatus } from "@/lib/sla";
import { sendStatusUpdateEmail } from "@/lib/email";
import type { Status } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isEngineerOrAdmin = ["ENGINEER", "ADMIN"].includes(dbUser.role);

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { id: true, name: true } },
        submitter: { select: { id: true, name: true, email: true } },
        comments: {
          where: isEngineerOrAdmin ? {} : { isInternal: false },
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
    if (!dbUser || !["ENGINEER", "ADMIN"].includes(dbUser.role)) {
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

      // Auto-set timestamps based on status transition
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
          assignee: { select: { id: true, name: true } },
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

    // Send status update email when status changes (fire-and-forget)
    if (data.status && data.status !== existing.status) {
      sendStatusUpdateEmail({
        to: existing.submitterEmail,
        submitterName: existing.submitterName,
        shortId: existing.shortId,
        title: existing.title,
        newStatus: data.status,
      });
    }

    return NextResponse.json(ticket);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
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
