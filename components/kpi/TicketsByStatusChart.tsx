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
import type { Status } from "@prisma/client";

interface Props {
  data: { status: Status; count: number }[];
}

const statusColors: Record<Status, string> = {
  NEW: "#94a3b8",
  TRIAGED: "#3b82f6",
  IN_PROGRESS: "#6366f1",
  BLOCKED: "#ef4444",
  RESOLVED: "#22c55e",
  CLOSED: "#9ca3af",
};

const statusLabels: Record<Status, string> = {
  NEW: "New",
  TRIAGED: "Triaged",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function TicketsByStatusChart({ data }: Props) {
  const chartData = data.map((d) => ({ name: statusLabels[d.status], count: d.count, status: d.status }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Tickets by Status</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={statusColors[entry.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
