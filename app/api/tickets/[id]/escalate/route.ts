import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function notifyEscalation({
  shortId,
  title,
  severity,
  escalatedByName,
  note,
  ticketUrl,
}: {
  shortId: number;
  title: string;
  severity: string;
  escalatedByName: string;
  note: string;
  ticketUrl: string;
}) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;

  const sevEmoji: Record<string, string> = { P1: "🔴", P2: "🟠", P3: "🟡", P4: "⚪" };
  const ticketNum = `#${String(shortId).padStart(3, "0")}`;

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🚨 *ESCALATED* ${sevEmoji[severity] ?? ""} ${severity} ticket ${ticketNum} — management attention needed`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚨 *ESCALATED* ${sevEmoji[severity] ?? ""} <${ticketUrl}|${ticketNum}> — *${title}*\n\n> ${note}`,
          },
        },
        {
          type: "context",
          elements: [{ type: "mrkdwn", text: `Escalated by *${escalatedByName}*` }],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View Ticket" },
              url: ticketUrl,
              style: "danger",
            },
          ],
        },
      ],
    }),
  }).catch((err) => console.error("Escalation Slack error:", err));
}

export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const note: string = body.note?.trim() || "No additional context provided.";

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      select: { shortId: true, title: true, severity: true },
    });
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Add an internal comment recording the escalation
    await prisma.comment.create({
      data: {
        ticketId: params.id,
        authorId: dbUser.id,
        authorName: dbUser.name,
        body: `🚨 **Escalated to management** by ${dbUser.name}.\n\n${note}`,
        isInternal: true,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await notifyEscalation({
      shortId: ticket.shortId,
      title: ticket.title,
      severity: ticket.severity,
      escalatedByName: dbUser.name,
      note,
      ticketUrl: `${appUrl}/tickets/${params.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
