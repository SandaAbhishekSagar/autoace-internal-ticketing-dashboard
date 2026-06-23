"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import type { StatusHistoryItem } from "@/types";
import { ArrowRight } from "lucide-react";

interface StatusHistoryListProps {
  history: StatusHistoryItem[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-slate-100 text-slate-700" },
  TRIAGED: { label: "Triaged", color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700" },
  BLOCKED: { label: "Blocked", color: "bg-red-100 text-red-700" },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700" },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-600" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export function StatusHistoryList({ history }: StatusHistoryListProps) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );
  const visible = expanded ? sorted : sorted.slice(0, 6);

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400">No status changes yet.</p>;
  }

  return (
    <div>
      <div className="space-y-2">
        {visible.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="flex-1 flex items-center gap-1.5 flex-wrap min-w-0">
              {item.fromStatus ? (
                <>
                  <StatusPill status={item.fromStatus} />
                  <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <StatusPill status={item.toStatus} />
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-500">Created as</span>
                  <StatusPill status={item.toStatus} />
                </>
              )}
              {item.changedBy && (
                <span className="text-xs text-gray-400">
                  by <span className="font-medium text-gray-600">{item.changedBy.name}</span>
                </span>
              )}
            </div>
            <time
              className="text-xs text-gray-400 flex-shrink-0"
              title={format(new Date(item.changedAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(item.changedAt), { addSuffix: true })}
            </time>
          </div>
        ))}
      </div>

      {sorted.length > 6 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-blue-600 hover:underline font-medium"
        >
          Show all {sorted.length} changes
        </button>
      )}
    </div>
  );
}
