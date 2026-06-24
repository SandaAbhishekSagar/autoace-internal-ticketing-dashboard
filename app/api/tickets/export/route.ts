import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { format } from "date-fns";

function esc(v: string | null | undefined) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || !["ENGINEER", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    });

    const headers = [
      "ID", "Title", "Type", "Severity", "Priority", "Status",
      "Submitter Name", "Submitter Email", "Customer", "Dealership",
      "Assignee", "Comments", "SLA First Response (h)",
      "Time To Triage (h)", "Time To Resolve (h)",
      "Created At", "Updated At", "Resolved At",
    ];

    const rows = tickets.map((t) => {
      const firstResponseH =
        t.firstResponseAt
          ? Math.round(
              ((new Date(t.firstResponseAt).getTime() - new Date(t.createdAt).getTime()) /
                3_600_000) * 10
            ) / 10
          : "";
      const triageH =
        t.triagedAt
          ? Math.round(
              ((new Date(t.triagedAt).getTime() - new Date(t.createdAt).getTime()) /
                3_600_000) * 10
            ) / 10
          : "";
      const resolveH =
        t.resolvedAt
          ? Math.round(
              ((new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) /
                3_600_000) * 10
            ) / 10
          : "";

      return [
        esc(`#${String(t.shortId).padStart(3, "0")}`),
        esc(t.title),
        esc(t.issueType),
        esc(t.severity),
        esc(t.priority),
        esc(t.status),
        esc(t.submitterName),
        esc(t.submitterEmail),
        esc(t.customerName),
        esc(t.dealershipName),
        esc(t.assignee?.name),
        String(t._count.comments),
        String(firstResponseH),
        String(triageH),
        String(resolveH),
        esc(format(new Date(t.createdAt), "yyyy-MM-dd HH:mm")),
        esc(format(new Date(t.updatedAt), "yyyy-MM-dd HH:mm")),
        t.resolvedAt ? esc(format(new Date(t.resolvedAt), "yyyy-MM-dd HH:mm")) : "",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `autoace-tickets-${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
