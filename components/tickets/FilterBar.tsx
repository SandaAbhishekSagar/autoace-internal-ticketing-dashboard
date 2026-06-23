"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { Status, Severity, IssueType } from "@prisma/client";

export interface Filters {
  search: string;
  status: Status[];
  severity: Severity[];
  type: IssueType[];
  assigneeId: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  engineers: { id: string; name: string }[];
}

const statusOptions: { value: Status; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "TRIAGED", label: "Triaged" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const severityOptions: { value: Severity; label: string; color: string }[] = [
  { value: "P1", label: "P1", color: "bg-red-500" },
  { value: "P2", label: "P2", color: "bg-orange-500" },
  { value: "P3", label: "P3", color: "bg-yellow-500" },
  { value: "P4", label: "P4", color: "bg-gray-400" },
];

const typeOptions: { value: IssueType; label: string }[] = [
  { value: "BUG", label: "🐛 Bug" },
  { value: "CALL_FAILURE", label: "📞 Call Failure" },
  { value: "CUSTOMER_ISSUE", label: "👤 Customer Issue" },
  { value: "INTEGRATION", label: "🔗 Integration" },
  { value: "OPS_REQUEST", label: "⚙️ Ops Request" },
];

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

const isFiltersActive = (f: Filters) =>
  f.search ||
  f.status.length > 0 ||
  f.severity.length > 0 ||
  f.type.length > 0 ||
  f.assigneeId;

export function FilterBar({ filters, onChange, engineers }: FilterBarProps) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const clearFilters = () =>
    onChange({ search: "", status: [], severity: [], type: [], assigneeId: "" });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search tickets..."
            className="pl-9"
          />
        </div>
        {isFiltersActive(filters) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
          {statusOptions.map((opt) => (
            <ToggleButton
              key={opt.value}
              active={filters.status.includes(opt.value)}
              onClick={() => onChange({ ...filters, status: toggle(filters.status, opt.value) })}
            >
              {opt.label}
            </ToggleButton>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500 mr-1">Severity:</span>
          {severityOptions.map((opt) => (
            <ToggleButton
              key={opt.value}
              active={filters.severity.includes(opt.value)}
              onClick={() => onChange({ ...filters, severity: toggle(filters.severity, opt.value) })}
            >
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                {opt.label}
              </span>
            </ToggleButton>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500 mr-1">Type:</span>
          {typeOptions.map((opt) => (
            <ToggleButton
              key={opt.value}
              active={filters.type.includes(opt.value)}
              onClick={() => onChange({ ...filters, type: toggle(filters.type, opt.value) })}
            >
              {opt.label}
            </ToggleButton>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500 mr-1">Assignee:</span>
          <select
            value={filters.assigneeId}
            onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700"
          >
            <option value="">All</option>
            <option value="unassigned">Unassigned</option>
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
