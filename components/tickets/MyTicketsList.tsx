"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TicketTimeline } from "./TicketTimeline";
import { CommentThread } from "./CommentThread";
import { FileText } from "lucide-react";
import Link from "next/link";
import type { Role, Status, Severity } from "@prisma/client";

interface MyTicket {
  id: string;
  shortId: number;
  title: string;
  description: string;
  status: Status;
  severity: Severity;
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

const statusMessages: Record<Status, string> = {
  NEW: "Received — our team is reviewing this",
  TRIAGED: "In review — assigned to an engineer",
  IN_PROGRESS: "In progress — being worked on now",
  BLOCKED: "On hold — we'll update you soon",
  RESOLVED: "Resolved — please let us know if this fixed the issue",
  CLOSED: "Closed",
};

const severityPlain: Record<Severity, { label: string; color: string }> = {
  P1: { label: "Critical", color: "text-red-600" },
  P2: { label: "High", color: "text-orange-600" },
  P3: { label: "Medium", color: "text-yellow-600" },
  P4: { label: "Low", color: "text-green-600" },
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

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <Skeleton className="h-5 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FileText className="h-16 w-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium text-gray-600 mb-1">Nothing submitted yet</h3>
        <p className="text-sm mb-6">Something not working?</p>
        <Link href="/submit" target="_blank">
          <Button>Submit an issue →</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const sev = severityPlain[ticket.severity];
        return (
          <div
            key={ticket.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">
                    #{String(ticket.shortId).padStart(3, "0")}
                  </span>
                  <span className={`text-xs font-medium ${sev.color}`}>
                    ● {sev.label}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {statusMessages[ticket.status]}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Submitted{" "}
                  {formatDistanceToNow(new Date(ticket.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected(ticket)}
                className="flex-shrink-0"
              >
                View & Reply
              </Button>
            </div>
          </div>
        );
      })}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" side="right">
          {selected && (
            <>
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-left text-lg">{selected.title}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    #{String(selected.shortId).padStart(3, "0")}
                  </span>
                  <span className={`text-xs font-medium ${severityPlain[selected.severity].color}`}>
                    ● {severityPlain[selected.severity].label}
                  </span>
                </div>
                <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2 mt-2">
                  {statusMessages[selected.status]}
                </p>
              </SheetHeader>

              <div className="py-4 space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    What you reported
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selected.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Progress</h4>
                  <TicketTimeline
                    createdAt={new Date(selected.createdAt)}
                    triagedAt={selected.triagedAt ? new Date(selected.triagedAt) : null}
                    firstResponseAt={
                      selected.firstResponseAt ? new Date(selected.firstResponseAt) : null
                    }
                    resolvedAt={selected.resolvedAt ? new Date(selected.resolvedAt) : null}
                    closedAt={selected.closedAt ? new Date(selected.closedAt) : null}
                  />
                </div>

                <div className="border-t pt-4">
                  <CommentThread
                    ticketId={selected.id}
                    comments={selected.comments}
                    role={role}
                    onCommentAdded={fetchTickets}
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
