"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, X, Building2, User2, Clock, Calendar, Paperclip } from "lucide-react";
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
      if (res.ok) setTicket(await res.json());
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) { setTicket(null); fetchTicket(); }
  }, [ticketId, fetchTicket]);

  return (
    <Sheet open={!!ticketId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden border-l-0 shadow-2xl"
        side="right"
      >
        {loading && (
          <div className="p-6 space-y-5">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {!loading && ticket && (
          <>
            {/* Gradient header */}
            <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-gray-800 to-gray-900 flex-shrink-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">
                    #{String(ticket.shortId).padStart(3, "0")}
                  </span>
                  <SeverityBadge severity={ticket.severity} />
                  <StatusBadge status={ticket.status} className="bg-white/10 text-white ring-white/20" />
                  <TypeBadge type={ticket.issueType} className="bg-white/10 text-white border-white/20" />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/tickets/${ticket.id}`} target="_blank">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h2 className="text-lg font-bold text-white leading-tight">{ticket.title}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* SLA Banner */}
                <SLABanner
                  severity={ticket.severity}
                  createdAt={new Date(ticket.createdAt)}
                  firstResponseAt={ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : null}
                />

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {ticket.description}
                  </p>
                </div>

                {/* Attachments */}
                {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" /> Attachments
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachmentUrls.map((url, i) => {
                        const filename = url.split("/").pop()?.replace(/^\d+_/, "") ?? `file-${i + 1}`;
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        return isImage ? (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={filename} className="h-20 w-32 object-cover" />
                          </a>
                        ) : (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors">
                            <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{filename}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <User2 className="h-3 w-3" /> Submitted by
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.submitterName}</p>
                    <p className="text-xs text-gray-500 truncate">{ticket.submitterEmail}</p>
                  </div>
                  {ticket.dealershipName && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                        <Building2 className="h-3 w-3" /> Dealership
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{ticket.dealershipName}</p>
                    </div>
                  )}
                  {ticket.customerName && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                        <User2 className="h-3 w-3" /> Customer
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{ticket.customerName}</p>
                    </div>
                  )}
                  {ticket.assignee && (
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs text-blue-400 mb-1">Assigned to</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                          {ticket.assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <p className="text-sm font-semibold text-blue-900">{ticket.assignee.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Progress Timeline
                  </h4>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <TicketTimeline
                      createdAt={new Date(ticket.createdAt)}
                      triagedAt={ticket.triagedAt ? new Date(ticket.triagedAt) : null}
                      firstResponseAt={ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : null}
                      resolvedAt={ticket.resolvedAt ? new Date(ticket.resolvedAt) : null}
                      closedAt={ticket.closedAt ? new Date(ticket.closedAt) : null}
                    />
                  </div>
                </div>

                {/* Status history */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Activity
                  </h4>
                  <StatusHistoryList history={ticket.history} />
                </div>

                {/* Comments */}
                <div className="border-t border-gray-100 pt-4">
                  <CommentThread
                    ticketId={ticket.id}
                    comments={ticket.comments}
                    role={role}
                    onCommentAdded={fetchTicket}
                  />
                </div>

              </div>
            </div>
          </>
        )}

        {!loading && !ticket && ticketId && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">Could not load ticket.</p>
            <Button variant="ghost" size="sm" onClick={fetchTicket} className="mt-2">
              Retry
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
