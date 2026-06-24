import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSLAStatus } from "@/lib/sla";
import { notifySlaEscalation } from "@/lib/slack";
import type { Severity, Status } from "@prisma/client";

export const dynamic = "force-dynamic";

const OPEN_STATUSES: Status[] = ["NEW", "TRIAGED", "IN_PROGRESS", "BLOCKED"];

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Run every 30 min via Railway cron: GET /api/cron/sla-escalation with Bearer CRON_SECRET */
export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const onCall = await prisma.user.findFirst({
      where: { isOnCall: true, role: { in: ["ENGINEER", "ADMIN"] } },
      select: { name: true },
    });

    const candidates = await prisma.ticket.findMany({
      where: {
        status: { in: OPEN_STATUSES },
        firstResponseAt: null,
        slaEscalatedAt: null,
        severity: { in: ["P1", "P2", "P3"] },
      },
      select: {
        id: true,
        shortId: true,
        title: true,
        severity: true,
        createdAt: true,
      },
    });

    let escalated = 0;

    for (const ticket of candidates) {
      const sla = getSLAStatus(
        ticket.severity as Severity,
        ticket.createdAt,
        null
      );
      if (sla !== "breached") continue;

      const ticketUrl = `${appUrl}/tickets/${ticket.id}`;

      await prisma.$transaction([
        prisma.ticket.update({
          where: { id: ticket.id },
          data: { slaEscalatedAt: new Date() },
        }),
        prisma.comment.create({
          data: {
            ticketId: ticket.id,
            authorName: "System",
            body: `⏰ **Auto SLA escalation** — ${ticket.severity} ticket breached response SLA with no first response. On-call notified via Slack.`,
            isInternal: true,
          },
        }),
      ]);

      await notifySlaEscalation({
        shortId: ticket.shortId,
        title: ticket.title,
        severity: ticket.severity,
        onCallName: onCall?.name ?? null,
        ticketUrl,
      });

      escalated++;
    }

    return NextResponse.json({ checked: candidates.length, escalated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
