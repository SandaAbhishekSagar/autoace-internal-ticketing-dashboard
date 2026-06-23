"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import { TypeBadge } from "./TypeBadge";
import { SLABanner } from "./SLABanner";
import { TicketTimeline } from "./TicketTimeline";
import { CommentThread } from "./CommentThread";
import { StatusHistoryList } from "./StatusHistoryList";
import type { TicketDetail } from "@/types";
import type { Role } from "@prisma/client";

interface TicketDetailPanelProps {
  ticketId: string | null;
  onClose: () => void;
  role: Role;
}

export function TicketDetailPanel({ ticketId, onClose, role }: TicketDetailPanelProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      setTicket(null);
      fetchTicket();
    }
  }, [ticketId, fetchTicket]);

  return (
    <Sheet open={!!ticketId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" side="right">
        {loading && (
          <div className="space-y-4 p-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!loading && ticket && (
          <>
            <SheetHeader className="pb-4 border-b">
              <div className="flex items-start justify-between gap-2">
                <SheetTitle className="text-left text-lg leading-tight">{ticket.title}</SheetTitle>
                <Link
                  href={`/tickets/${ticket.id}`}
                  target="_blank"
                  className="flex-shrink-0"
                >
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm text-gray-500">#{String(ticket.shortId).padStart(3, "0")}</span>
                <SeverityBadge severity={ticket.severity} />
                <StatusBadge status={ticket.status} />
                <TypeBadge type={ticket.issueType} />
              </div>
            </SheetHeader>

            <div className="py-4 space-y-5">
              <SLABanner
                severity={ticket.severity}
                createdAt={new Date(ticket.createdAt)}
                firstResponseAt={ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : null}
              />

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Submitted by</span>
                  <p className="font-medium">{ticket.submitterName}</p>
                  <p className="text-gray-500 text-xs">{ticket.submitterEmail}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="font-medium" title={format(new Date(ticket.createdAt), "PPpp")}>
                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {ticket.customerName && (
                  <div>
                    <span className="text-gray-500">Customer</span>
                    <p className="font-medium">{ticket.customerName}</p>
                  </div>
                )}
                {ticket.dealershipName && (
                  <div>
                    <span className="text-gray-500">Dealership</span>
                    <p className="font-medium">{ticket.dealershipName}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
                <TicketTimeline
                  createdAt={new Date(ticket.createdAt)}
                  triagedAt={ticket.triagedAt ? new Date(ticket.triagedAt) : null}
                  firstResponseAt={ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : null}
                  resolvedAt={ticket.resolvedAt ? new Date(ticket.resolvedAt) : null}
                  closedAt={ticket.closedAt ? new Date(ticket.closedAt) : null}
                />
              </div>

              <div className="border-t pt-4">
                <StatusHistoryList history={ticket.history} />
              </div>

              <div className="border-t pt-4">
                <CommentThread
                  ticketId={ticket.id}
                  comments={ticket.comments}
                  role={role}
                  onCommentAdded={fetchTicket}
                />
              </div>
            </div>
          </>
        )}

        {!loading && !ticket && ticketId && (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500">Could not load ticket.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
