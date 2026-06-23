"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { IssueType } from "@prisma/client";

interface Props {
  data: { type: IssueType; count: number }[];
}

const typeColors: Record<IssueType, string> = {
  BUG: "#7c3aed",
  CALL_FAILURE: "#2563eb",
  CUSTOMER_ISSUE: "#ec4899",
  INTEGRATION: "#0d9488",
  OPS_REQUEST: "#6b7280",
};

const typeLabels: Record<IssueType, string> = {
  BUG: "Bug",
  CALL_FAILURE: "Call",
  CUSTOMER_ISSUE: "Customer",
  INTEGRATION: "Integration",
  OPS_REQUEST: "Ops",
};

export function TicketsByTypeChart({ data }: Props) {
  const chartData = data.map((d) => ({ name: typeLabels[d.type], count: d.count, type: d.type }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Tickets by Issue Type</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={typeColors[entry.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
