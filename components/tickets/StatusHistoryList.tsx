"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import type { StatusHistoryItem } from "@/types";

interface StatusHistoryListProps {
  history: StatusHistoryItem[];
}

const statusLabels: Record<string, string> = {
  NEW: "New",
  TRIAGED: "Triaged",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function StatusHistoryList({ history }: StatusHistoryListProps) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );
  const visible = expanded ? sorted : sorted.slice(0, 10);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Status History</h3>
      <div className="space-y-2">
        {visible.map((item) => (
          <div key={item.id} className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-700">
                Status changed{" "}
                {item.fromStatus && (
                  <>
                    from{" "}
                    <span className="font-medium">{statusLabels[item.fromStatus]}</span>
                    {" → "}
                  </>
                )}
                {!item.fromStatus && "to "}
                <span className="font-medium">{statusLabels[item.toStatus]}</span>
                {item.changedBy && (
                  <> by <span className="font-medium">{item.changedBy.name}</span></>
                )}
              </span>
              {item.note && (
                <p className="text-gray-500 mt-0.5 text-xs">{item.note}</p>
              )}
            </div>
            <time
              className="text-gray-400 text-xs flex-shrink-0"
              title={format(new Date(item.changedAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(item.changedAt), { addSuffix: true })}
            </time>
          </div>
        ))}
      </div>
      {sorted.length > 10 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Show all {sorted.length} changes
        </button>
      )}
      {sorted.length === 0 && (
        <p className="text-sm text-gray-400">No status changes yet.</p>
      )}
    </div>
  );
}
