"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Status, Severity, IssueType, Priority } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface Filters {
  search: string;
  status: Status[];
  severity: Severity[];
  type: IssueType[];
  priority: Priority[];
  assigneeId: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  engineers: { id: string; name: string }[];
}

const statusOptions: { value: Status; label: string; color: string }[] = [
  { value: "NEW", label: "New", color: "bg-slate-100 text-slate-700 hover:bg-slate-200 data-[active=true]:bg-slate-700 data-[active=true]:text-white" },
  { value: "TRIAGED", label: "Triaged", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 data-[active=true]:bg-blue-600 data-[active=true]:text-white" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 data-[active=true]:bg-indigo-600 data-[active=true]:text-white" },
  { value: "BLOCKED", label: "Blocked", color: "bg-red-50 text-red-700 hover:bg-red-100 data-[active=true]:bg-red-600 data-[active=true]:text-white" },
  { value: "RESOLVED", label: "Resolved", color: "bg-green-50 text-green-700 hover:bg-green-100 data-[active=true]:bg-green-600 data-[active=true]:text-white" },
  { value: "CLOSED", label: "Closed", color: "bg-gray-100 text-gray-600 hover:bg-gray-200 data-[active=true]:bg-gray-600 data-[active=true]:text-white" },
];

const severityOptions: { value: Severity; label: string; dot: string }[] = [
  { value: "P1", label: "P1", dot: "bg-red-500" },
  { value: "P2", label: "P2", dot: "bg-orange-500" },
  { value: "P3", label: "P3", dot: "bg-amber-400" },
  { value: "P4", label: "P4", dot: "bg-gray-300" },
];

const typeOptions: { value: IssueType; label: string; icon: string }[] = [
  { value: "BUG", label: "Bug", icon: "🐛" },
  { value: "CALL_FAILURE", label: "Call Failure", icon: "📞" },
  { value: "CUSTOMER_ISSUE", label: "Customer", icon: "👤" },
  { value: "INTEGRATION", label: "Integration", icon: "🔗" },
  { value: "OPS_REQUEST", label: "Ops", icon: "⚙️" },
];

const priorityOptions: { value: Priority; label: string; dot: string }[] = [
  { value: "URGENT", label: "Urgent", dot: "bg-red-600" },
  { value: "HIGH", label: "High", dot: "bg-orange-500" },
  { value: "MEDIUM", label: "Medium", dot: "bg-yellow-400" },
  { value: "LOW", label: "Low", dot: "bg-gray-300" },
];

const isFiltersActive = (f: Filters) =>
  f.search || f.status.length > 0 || f.severity.length > 0 || f.type.length > 0 || f.priority.length > 0 || f.assigneeId;

export function FilterBar({ filters, onChange, engineers }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const clearFilters = () =>
    onChange({ search: "", status: [], severity: [], type: [], priority: [], assigneeId: "" });

  const activeCount =
    filters.status.length +
    filters.severity.length +
    filters.type.length +
    filters.priority.length +
    (filters.assigneeId ? 1 : 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Top search row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search tickets, customers, dealerships..."
            className="pl-9 border-gray-200 bg-gray-50 focus:bg-white text-sm"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "gap-1.5 text-sm flex-shrink-0",
            (expanded || activeCount > 0) && "border-blue-500 text-blue-600"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </Button>

        {isFiltersActive(filters) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-gray-700 flex-shrink-0 gap-1">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Expandable filter rows */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">Status</span>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((opt) => {
                const active = filters.status.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-active={active}
                    onClick={() => onChange({ ...filters, status: toggle(filters.status, opt.value) })}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                      active
                        ? "border-transparent shadow-sm"
                        : "border-gray-200",
                      opt.color
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">Severity</span>
            <div className="flex flex-wrap gap-1.5">
              {severityOptions.map((opt) => {
                const active = filters.severity.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ ...filters, severity: toggle(filters.severity, opt.value) })}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5",
                      active
                        ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", opt.dot)} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">Type</span>
            <div className="flex flex-wrap gap-1.5">
              {typeOptions.map((opt) => {
                const active = filters.type.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ ...filters, type: toggle(filters.type, opt.value) })}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border flex items-center gap-1",
                      active
                        ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">Priority</span>
            <div className="flex flex-wrap gap-1.5">
              {priorityOptions.map((opt) => {
                const active = filters.priority.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ ...filters, priority: toggle(filters.priority, opt.value) })}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5",
                      active
                        ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", opt.dot)} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">Assignee</span>
            <select
              value={filters.assigneeId}
              onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All engineers</option>
              <option value="unassigned">Unassigned</option>
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
