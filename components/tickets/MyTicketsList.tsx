"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TicketTimeline } from "./TicketTimeline";
import { CommentThread } from "./CommentThread";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import {
  FileText,
  Phone,
  Bug,
  Link2,
  Settings,
  User,
  ChevronRight,
  X,
  Clock,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import type { Role, Status, Severity } from "@prisma/client";

interface MyTicket {
  id: string;
  shortId: number;
  title: string;
  description: string;
  status: Status;
  severity: Severity;
  issueType: string;
  createdAt: string;
  firstResponseAt: string | null;
  triagedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  reopenedAt: string | null;
  comments: import("@/types").CommentItem[];
  history: import("@/types").StatusHistoryItem[];
}

interface MyTicketsListProps {
  userId: string;
  role: Role;
}

const statusMessages: Record<Status, { text: string; color: string }> = {
  NEW: { text: "Received — our team is reviewing this", color: "bg-slate-50 text-slate-700 border-slate-200" },
  TRIAGED: { text: "In review — assigned to an engineer", color: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_PROGRESS: { text: "In progress — being worked on now", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  BLOCKED: { text: "On hold — we'll update you soon", color: "bg-amber-50 text-amber-700 border-amber-200" },
  RESOLVED: { text: "Resolved — please confirm if this fixed the issue", color: "bg-green-50 text-green-700 border-green-200" },
  CLOSED: { text: "Closed", color: "bg-gray-50 text-gray-600 border-gray-200" },
};

const severityLeftBorder: Record<Severity, string> = {
  P1: "border-l-red-500",
  P2: "border-l-orange-400",
  P3: "border-l-amber-400",
  P4: "border-l-gray-300",
};

const issueTypeIcon: Record<string, React.ElementType> = {
  BUG: Bug,
  CALL_FAILURE: Phone,
  CUSTOMER_ISSUE: User,
  INTEGRATION: Link2,
  OPS_REQUEST: Settings,
};

const issueTypeLabel: Record<string, string> = {
  BUG: "Bug",
  CALL_FAILURE: "Call Failure",
  CUSTOMER_ISSUE: "Customer Issue",
  INTEGRATION: "Integration",
  OPS_REQUEST: "Ops Request",
};

export function MyTicketsList({ role }: MyTicketsListProps) {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MyTicket | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <Skeleton className="h-5 w-2/3 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-base font-semibold text-gray-600 mb-1">Nothing submitted yet</h3>
        <p className="text-sm mb-6">If something isn&apos;t working, let us know.</p>
        <Link href="/submit" target="_blank">
          <Button className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Submit an issue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tickets.map((ticket) => {
          const IssueIcon = issueTypeIcon[ticket.issueType] ?? FileText;
          const statusMsg = statusMessages[ticket.status];
          const publicComments = ticket.comments?.filter((c) => !c.isInternal) ?? [];

          return (
            <div
              key={ticket.id}
              className={`bg-white rounded-xl border border-l-4 border-gray-200 ${severityLeftBorder[ticket.severity]} p-5 hover:shadow-md transition-all duration-200 cursor-pointer group`}
              onClick={() => setSelected(ticket)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Top row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">
                      #{String(ticket.shortId).padStart(3, "0")}
                    </span>
                    <SeverityBadge severity={ticket.severity} />
                    <StatusBadge status={ticket.status} />
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <IssueIcon className="h-3 w-3" />
                      {issueTypeLabel[ticket.issueType]}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-snug">
                    {ticket.title}
                  </h3>

                  {/* Status message */}
                  <p className={`text-xs mt-2 inline-block px-2.5 py-1 rounded-full border font-medium ${statusMsg.color}`}>
                    {statusMsg.text}
                  </p>

                  {/* Footer row */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </span>
                    {publicComments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {publicComments.length} {publicComments.length === 1 ? "reply" : "replies"}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          className="w-full sm:max-w-xl p-0 flex flex-col overflow-hidden border-l-0 shadow-2xl"
          side="right"
        >
          {selected && (
            <>
              {/* Header — colored by severity */}
              <div
                className={`px-6 pt-6 pb-5 flex-shrink-0 ${
                  selected.severity === "P1"
                    ? "bg-gradient-to-br from-red-600 to-red-700"
                    : selected.severity === "P2"
                    ? "bg-gradient-to-br from-orange-500 to-orange-600"
                    : selected.severity === "P3"
                    ? "bg-gradient-to-br from-amber-500 to-amber-600"
                    : "bg-gradient-to-br from-gray-700 to-gray-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-white/70 font-mono">
                        #{String(selected.shortId).padStart(3, "0")}
                      </span>
                      <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                        {selected.severity === "P1" ? "Critical" : selected.severity === "P2" ? "High" : selected.severity === "P3" ? "Medium" : "Low"}
                      </span>
                      <StatusBadge status={selected.status} className="bg-white/20 text-white ring-white/30" />
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      {selected.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className={`mt-3 px-3 py-2 rounded-lg border text-sm font-medium ${statusMessages[selected.status].color} bg-white/90`}>
                  {statusMessages[selected.status].text}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-5 space-y-6">

                  {/* What you reported */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      What you reported
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                      {selected.description}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Submitted</p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Issue Type</p>
                      <p className="text-sm font-medium text-gray-800">
                        {issueTypeLabel[selected.issueType] ?? selected.issueType}
                      </p>
                    </div>
                  </div>

                  {/* Progress timeline */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Progress
                    </h4>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                      <TicketTimeline
                        createdAt={new Date(selected.createdAt)}
                        triagedAt={selected.triagedAt ? new Date(selected.triagedAt) : null}
                        firstResponseAt={selected.firstResponseAt ? new Date(selected.firstResponseAt) : null}
                        resolvedAt={selected.resolvedAt ? new Date(selected.resolvedAt) : null}
                        closedAt={selected.closedAt ? new Date(selected.closedAt) : null}
                      />
                    </div>
                  </div>

                  {/* View full ticket link */}
                  <Link
                    href={`/tickets/${selected.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors group"
                  >
                    <span className="text-sm font-medium">View full ticket page</span>
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>

                  {/* Comments */}
                  <div className="border-t border-gray-100 pt-4">
                    <CommentThread
                      ticketId={selected.id}
                      comments={selected.comments}
                      role={role}
                      onCommentAdded={fetchTickets}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
