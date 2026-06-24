import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { trackingToken: params.token },
      include: {
        assignee: { select: { name: true } },
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            authorName: true,
            createdAt: true,
          },
        },
        history: {
          orderBy: { changedAt: "desc" },
          select: { toStatus: true, changedAt: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Return sanitized view — no internal notes, no private fields
    return NextResponse.json({
      shortId: ticket.shortId,
      title: ticket.title,
      status: ticket.status,
      severity: ticket.severity,
      issueType: ticket.issueType,
      submitterName: ticket.submitterName,
      customerName: ticket.customerName,
      dealershipName: ticket.dealershipName,
      assigneeName: ticket.assignee?.name ?? null,
      createdAt: ticket.createdAt,
      triagedAt: ticket.triagedAt,
      firstResponseAt: ticket.firstResponseAt,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      comments: ticket.comments,
      history: ticket.history,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
