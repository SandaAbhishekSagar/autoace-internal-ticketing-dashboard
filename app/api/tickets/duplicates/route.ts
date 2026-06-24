import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["NEW", "TRIAGED", "IN_PROGRESS", "BLOCKED"] as const;

/** Public duplicate check for the submit form (no auth required). */
export async function GET(req: NextRequest) {
  try {
    const title = req.nextUrl.searchParams.get("title")?.trim() ?? "";
    if (title.length < 8) {
      return NextResponse.json({ tickets: [] });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: [...OPEN_STATUSES] },
        title: { contains: title, mode: "insensitive" },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { shortId: true, title: true, status: true },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ tickets: [] });
  }
}
