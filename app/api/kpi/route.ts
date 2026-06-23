import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSLAStatus } from "@/lib/sla";
import { format, subDays, eachDayOfInterval } from "date-fns";
import type { Severity, Status, IssueType } from "@prisma/client";

function getDateRange(range: string): Date | null {
  if (range === "7d") return subDays(new Date(), 7);
  if (range === "30d") return subDays(new Date(), 30);
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || !["ENGINEER", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const range = req.nextUrl.searchParams.get("range") ?? "30d";
    const since = getDateRange(range);
    const where = since ? { createdAt: { gte: since } } : {};

    const allTickets = await prisma.ticket.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    const openStatuses = ["NEW", "TRIAGED", "IN_PROGRESS", "BLOCKED"];
    const openTickets = allTickets.filter((t) => openStatuses.includes(t.status));
    const openCount = openTickets.length;
    const criticalOpenCount = openTickets.filter((t) =>
      ["P1", "P2"].includes(t.severity)
    ).length;

    // Avg first response
    const withResponse = allTickets.filter((t) => t.firstResponseAt);
    const avgFirstResponseHours =
      withResponse.length > 0
        ? Math.round(
            (withResponse.reduce((acc, t) => {
              return (
                acc +
                (new Date(t.firstResponseAt!).getTime() -
                  new Date(t.createdAt).getTime())
              );
            }, 0) /
              withResponse.length /
              3_600_000) *
              10
          ) / 10
        : null;

    // Avg time to resolve
    const resolved = allTickets.filter((t) => t.resolvedAt);
    const avgResolutionHours =
      resolved.length > 0
        ? Math.round(
            (resolved.reduce((acc, t) => {
              return (
                acc +
                (new Date(t.resolvedAt!).getTime() -
                  new Date(t.createdAt).getTime())
              );
            }, 0) /
              resolved.length /
              3_600_000) *
              10
          ) / 10
        : null;

    // SLA breaches
    const slaBreachCount = allTickets.filter((t) => {
      if (openStatuses.includes(t.status)) {
        return getSLAStatus(t.severity as Severity, t.createdAt, t.firstResponseAt) === "breached";
      }
      return false;
    }).length;

    // Reopen rate
    const reopened = allTickets.filter((t) => t.reopenedAt).length;
    const reopenRate =
      resolved.length > 0
        ? Math.round((reopened / resolved.length) * 100)
        : 0;

    // By type
    const typeCount: Record<string, number> = {};
    allTickets.forEach((t) => {
      typeCount[t.issueType] = (typeCount[t.issueType] || 0) + 1;
    });
    const byType = Object.entries(typeCount).map(([type, count]) => ({
      type: type as IssueType,
      count,
    }));

    // By status
    const statusCount: Record<string, number> = {};
    allTickets.forEach((t) => {
      statusCount[t.status] = (statusCount[t.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusCount).map(([status, count]) => ({
      status: status as Status,
      count,
    }));

    // By severity
    const severityCount: Record<string, number> = {};
    allTickets.forEach((t) => {
      severityCount[t.severity] = (severityCount[t.severity] || 0) + 1;
    });
    const bySeverity = Object.entries(severityCount).map(([severity, count]) => ({
      severity: severity as Severity,
      count,
    }));

    // Daily created
    const days = range === "all" ? 30 : parseInt(range) || 30;
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date(),
    });
    const dailyMap: Record<string, number> = {};
    allTickets.forEach((t) => {
      const d = format(new Date(t.createdAt), "MMM d");
      dailyMap[d] = (dailyMap[d] || 0) + 1;
    });
    const dailyCreated = interval.map((d) => ({
      date: format(d, "MMM d"),
      count: dailyMap[format(d, "MMM d")] || 0,
    }));

    // By engineer
    const engineerMap: Record<
      string,
      {
        name: string;
        assigned: number;
        resolved: number;
        openCritical: number;
        resolveTimes: number[];
      }
    > = {};
    allTickets.forEach((t) => {
      if (!t.assignee) return;
      const id = t.assignee.id;
      if (!engineerMap[id]) {
        engineerMap[id] = {
          name: t.assignee.name,
          assigned: 0,
          resolved: 0,
          openCritical: 0,
          resolveTimes: [],
        };
      }
      engineerMap[id].assigned++;
      if (t.status === "RESOLVED" || t.status === "CLOSED") {
        engineerMap[id].resolved++;
        if (t.resolvedAt) {
          engineerMap[id].resolveTimes.push(
            (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3_600_000
          );
        }
      }
      if (openStatuses.includes(t.status) && ["P1", "P2"].includes(t.severity)) {
        engineerMap[id].openCritical++;
      }
    });
    const byEngineer = Object.values(engineerMap)
      .map((e) => ({
        name: e.name,
        assigned: e.assigned,
        resolved: e.resolved,
        openCritical: e.openCritical,
        avgResolveHours:
          e.resolveTimes.length > 0
            ? Math.round(
                (e.resolveTimes.reduce((a, b) => a + b, 0) / e.resolveTimes.length) * 10
              ) / 10
            : null,
      }))
      .sort((a, b) => b.openCritical - a.openCritical);

    // By customer
    const customerMap: Record<
      string,
      { name: string; total: number; open: number; critical: number; resolveTimes: number[] }
    > = {};
    allTickets.forEach((t) => {
      const name = t.dealershipName || t.customerName;
      if (!name) return;
      if (!customerMap[name]) {
        customerMap[name] = { name, total: 0, open: 0, critical: 0, resolveTimes: [] };
      }
      customerMap[name].total++;
      if (openStatuses.includes(t.status)) customerMap[name].open++;
      if (["P1", "P2"].includes(t.severity)) customerMap[name].critical++;
      if (t.resolvedAt) {
        customerMap[name].resolveTimes.push(
          (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3_600_000
        );
      }
    });
    const byCustomer = Object.values(customerMap)
      .map((c) => ({
        name: c.name,
        total: c.total,
        open: c.open,
        critical: c.critical,
        avgResolveHours:
          c.resolveTimes.length > 0
            ? Math.round(
                (c.resolveTimes.reduce((a, b) => a + b, 0) / c.resolveTimes.length) * 10
              ) / 10
            : null,
      }))
      .sort((a, b) => b.critical - a.critical);

    return NextResponse.json({
      openCount,
      criticalOpenCount,
      avgFirstResponseHours,
      avgResolutionHours,
      slaBreachCount,
      reopenRate,
      byType,
      byStatus,
      bySeverity,
      dailyCreated,
      byEngineer,
      byCustomer,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
