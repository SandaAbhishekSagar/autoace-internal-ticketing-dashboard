import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapLinearStateToStatus } from "@/lib/linear";
import type { Status } from "@prisma/client";

export const dynamic = "force-dynamic";

interface LinearWebhookPayload {
  action: string;
  type: string;
  data: {
    id: string;
    state?: { type: string };
  };
}

/** Linear webhook: sync issue state changes back to AutoAce tickets. */
export async function POST(req: NextRequest) {
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get("linear-signature");
    if (header !== secret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  try {
    const payload = (await req.json()) as LinearWebhookPayload;

    if (payload.type !== "Issue" || !["create", "update"].includes(payload.action)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const linearIssueId = payload.data.id;
    const newStatus = payload.data.state?.type
      ? mapLinearStateToStatus(payload.data.state.type)
      : null;

    if (!newStatus) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { linearIssueId },
    });
    if (!ticket || ticket.status === newStatus) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "TRIAGED" && !ticket.triagedAt) updateData.triagedAt = now;
    if (["TRIAGED", "IN_PROGRESS", "BLOCKED"].includes(newStatus) && !ticket.firstResponseAt) {
      updateData.firstResponseAt = now;
    }
    if (newStatus === "RESOLVED") updateData.resolvedAt = now;
    if (newStatus === "CLOSED") updateData.closedAt = now;

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticket.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: updateData as any,
      });
      await tx.statusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: ticket.status,
          toStatus: newStatus as Status,
          note: "Synced from Linear",
        },
      });
    });

    return NextResponse.json({ ok: true, ticketId: ticket.id, newStatus });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
