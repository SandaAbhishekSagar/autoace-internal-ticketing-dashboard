"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TicketRow } from "./TicketRow";
import { FilterBar, type Filters } from "./FilterBar";
import { BulkActionBar } from "./BulkActionBar";
import { TicketDetailPanel } from "./TicketDetailPanel";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { TicketSummary } from "@/types";
import type { Role, Status } from "@prisma/client";
import { toast } from "sonner";

interface TicketTableProps {
  role: Role;
  currentUserId: string;
}

export function TicketTable({ role, currentUserId }: TicketTableProps) {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [engineers, setEngineers] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: [],
    severity: [],
    type: [],
    assigneeId: "",
  });

  const LIMIT = 25;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    if (filters.search) params.set("search", filters.search);
    if (filters.status.length) params.set("status", filters.status.join(","));
    if (filters.severity.length) params.set("severity", filters.severity.join(","));
    if (filters.type.length) params.set("type", filters.type.join(","));
    if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);

    try {
      const res = await fetch(`/api/tickets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetch("/api/users?role=ENGINEER,ADMIN")
      .then((r) => r.json())
      .then((data) => setEngineers(data.users || []));
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(tickets.map((t) => t.id)));
    else setSelectedIds(new Set());
  };

  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.has(t.id));

  const handleStatusChange = async (ticketId: string, status: Status) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Status updated");
      fetchTickets();
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleAssignToMe = async (ticketId: string) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: currentUserId }),
    });
    if (res.ok) {
      toast.success("Assigned to you");
      fetchTickets();
    } else {
      toast.error("Failed to assign");
    }
  };

  const handleBulkAssign = async (assigneeId: string) => {
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/tickets/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assigneeId: assigneeId === "unassigned" ? null : assigneeId,
          }),
        })
      )
    );
    toast.success(`Updated ${ids.length} tickets`);
    setSelectedIds(new Set());
    fetchTickets();
  };

  const handleBulkStatus = async (status: Status) => {
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/tickets/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      )
    );
    toast.success(`Updated ${ids.length} tickets`);
    setSelectedIds(new Set());
    fetchTickets();
  };

  const pages = Math.ceil(total / LIMIT);
  const start = (page - 1) * LIMIT + 1;
  const end = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} engineers={engineers} />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="pl-4 pr-2 py-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">
                  #
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Severity
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Assignee
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Customer
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Age
                </th>
                <th className="px-3 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={10} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))}
              {!loading &&
                tickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedIds.has(ticket.id)}
                    onSelect={toggleSelect}
                    onClick={setDetailId}
                    onStatusChange={handleStatusChange}
                    currentUserId={currentUserId}
                    onAssignToMe={handleAssignToMe}
                  />
                ))}
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Inbox className="h-12 w-12" />
                      <p className="font-medium">No tickets match your filters</p>
                      <button
                        onClick={() =>
                          setFilters({
                            search: "",
                            status: [],
                            severity: [],
                            type: [],
                            assigneeId: "",
                          })
                        }
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {start}–{end} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                {page} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        engineers={engineers}
        onAssign={handleBulkAssign}
        onStatusChange={handleBulkStatus}
        onClear={() => setSelectedIds(new Set())}
      />

      <TicketDetailPanel
        ticketId={detailId}
        onClose={() => setDetailId(null)}
        role={role}
      />
    </div>
  );
}
