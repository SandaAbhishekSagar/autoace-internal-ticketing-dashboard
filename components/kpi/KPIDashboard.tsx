"use client";

import { useState, useEffect } from "react";
import { KPISummaryCard } from "./KPISummaryCard";
import { TicketsByTypeChart } from "./TicketsByTypeChart";
import { TicketsByStatusChart } from "./TicketsByStatusChart";
import { TicketsBySeverityChart } from "./TicketsBySeverityChart";
import { DailyTrendChart } from "./DailyTrendChart";
import { EngineerTable } from "./EngineerTable";
import { CustomerTable } from "./CustomerTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertTriangle, Clock, BarChart3, RefreshCw, Target, Timer } from "lucide-react";
import type { KPIData } from "@/types";

type Range = "7d" | "30d" | "all";

export function KPIDashboard() {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kpi?range=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [range]);

  const RangeToggle = () => (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {(["7d", "30d", "all"] as Range[]).map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            range === r
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "All time"}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Operations Dashboard" action={<RangeToggle />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Failed to load KPI data.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Operations Dashboard" action={<RangeToggle />} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPISummaryCard
          label="Open Tickets"
          value={data.openCount}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <KPISummaryCard
          label="Critical Open (P1+P2)"
          value={data.criticalOpenCount}
          highlight={data.criticalOpenCount > 0}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KPISummaryCard
          label="Avg First Response"
          value={data.avgFirstResponseHours !== null ? `${data.avgFirstResponseHours}h` : "—"}
          subtext={data.avgFirstResponseHours === null ? "No data yet" : "time to first reply"}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPISummaryCard
          label="Avg Time to Triage"
          value={data.avgTimeToTriageHours !== null ? `${data.avgTimeToTriageHours}h` : "—"}
          subtext={data.avgTimeToTriageHours === null ? "No data yet" : "created → triaged"}
          icon={<Timer className="h-5 w-5" />}
        />
        <KPISummaryCard
          label="Avg Time to Resolve"
          value={data.avgResolutionHours !== null ? `${data.avgResolutionHours}h` : "—"}
          subtext={data.avgResolutionHours === null ? "No data yet" : "created → resolved"}
        />
        <KPISummaryCard
          label="SLA Breach Count"
          value={data.slaBreachCount}
          subtext="P1 >4h, P2 >8h, P3 >24h"
          highlight={data.slaBreachCount > 0}
        />
        <KPISummaryCard
          label="SLA Breach Rate"
          value={`${data.slaBreachRate}%`}
          subtext="% of all tickets breached"
          highlight={data.slaBreachRate > 10}
          icon={<Target className="h-5 w-5" />}
        />
        <KPISummaryCard
          label="Reopen Rate"
          value={`${data.reopenRate}%`}
          subtext="resolved then reopened"
          icon={<RefreshCw className="h-5 w-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TicketsByTypeChart data={data.byType} />
        <TicketsByStatusChart data={data.byStatus} />
        <TicketsBySeverityChart data={data.bySeverity} />
        <DailyTrendChart data={data.dailyCreated} />
      </div>

      {/* Tables */}
      <EngineerTable data={data.byEngineer} />
      <CustomerTable data={data.byCustomer} />
    </div>
  );
}
