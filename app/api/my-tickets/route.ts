import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { submitterId: dbUser.id },
          { submitterEmail: dbUser.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        shortId: true,
        title: true,
        description: true,
        issueType: true,
        severity: true,
        priority: true,
        status: true,
        submitterName: true,
        submitterEmail: true,
        customerName: true,
        dealershipName: true,
        createdAt: true,
        updatedAt: true,
        firstResponseAt: true,
        triagedAt: true,
        resolvedAt: true,
        closedAt: true,
        reopenedAt: true,
        links: true,
        attachmentUrls: true,
        callRecordingUrl: true,
        callMonitorName: true,
        _count: { select: { comments: { where: { isInternal: false } } } },
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            authorName: true,
            body: true,
            isInternal: true,
            createdAt: true,
            author: { select: { role: true } },
          },
        },
        history: {
          orderBy: { changedAt: "asc" },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            changedAt: true,
            note: true,
            changedBy: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
