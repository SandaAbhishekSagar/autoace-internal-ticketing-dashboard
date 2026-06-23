"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Status } from "@prisma/client";

interface BulkActionBarProps {
  selectedCount: number;
  engineers: { id: string; name: string }[];
  onAssign: (assigneeId: string) => void;
  onStatusChange: (status: Status) => void;
  onClear: () => void;
}

const statusOptions: { value: Status; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "TRIAGED", label: "Triaged" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export function BulkActionBar({
  selectedCount,
  engineers,
  onAssign,
  onStatusChange,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedCount} ticket{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <div className="h-4 w-px bg-gray-600" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Assign to:</span>
        <select
          className="text-xs bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-white"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onAssign(e.target.value);
          }}
        >
          <option value="">Select engineer</option>
          <option value="unassigned">Unassigned</option>
          {engineers.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div className="h-4 w-px bg-gray-600" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Status:</span>
        <select
          className="text-xs bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-white"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onStatusChange(e.target.value as Status);
          }}
        >
          <option value="">Change to</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="h-4 w-px bg-gray-600" />
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-gray-400 hover:text-white p-1 h-auto"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
