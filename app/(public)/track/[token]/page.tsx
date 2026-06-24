import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format, formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { SeverityBadge } from "@/components/tickets/SeverityBadge";
import { TypeBadge } from "@/components/tickets/TypeBadge";
import { TicketTimeline } from "@/components/tickets/TicketTimeline";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}) {
  const ticket = await prisma.ticket.findUnique({
    where: { trackingToken: params.token },
    select: { title: true, shortId: true },
  });
  return {
    title: ticket
      ? `Track Ticket #${String(ticket.shortId).padStart(3, "0")} — AutoAce Support`
      : "Ticket Tracking",
  };
}

export default async function TrackPage({
  params,
}: {
  params: { token: string };
}) {
  const ticket = await prisma.ticket.findUnique({
    where: { trackingToken: params.token },
    include: {
      assignee: { select: { name: true } },
      comments: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
      },
      history: {
        orderBy: { changedAt: "desc" },
        select: { toStatus: true, fromStatus: true, changedAt: true },
      },
    },
  });

  if (!ticket) notFound();

  const shortIdStr = String(ticket.shortId).padStart(3, "0");
  const isOpen = !["RESOLVED", "CLOSED"].includes(ticket.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="font-semibold text-gray-900">AutoAce Support</span>
          </div>
          <Link
            href="/submit"
            className="text-sm text-blue-600 hover:underline"
          >
            Submit new issue
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status banner */}
        <div
          className={`rounded-xl p-5 border ${
            isOpen
              ? "bg-blue-50 border-blue-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-500">
            Ticket #{shortIdStr}
          </p>
          <h1 className="text-xl font-bold text-gray-900 leading-tight mb-3">
            {ticket.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <SeverityBadge severity={ticket.severity} />
            <TypeBadge type={ticket.issueType} />
          </div>
          {ticket.assignee && (
            <p className="text-sm text-gray-600 mt-3">
              Assigned to{" "}
              <span className="font-medium">{ticket.assignee.name}</span>
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Progress
          </h2>
          <TicketTimeline
            createdAt={ticket.createdAt}
            triagedAt={ticket.triagedAt}
            firstResponseAt={ticket.firstResponseAt}
            resolvedAt={ticket.resolvedAt}
            closedAt={ticket.closedAt}
          />
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Submitted by</p>
            <p className="font-medium">{ticket.submitterName}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Opened</p>
            <p className="font-medium">
              {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
            </p>
            <p className="text-gray-400 text-xs">
              {format(ticket.createdAt, "MMM d, yyyy HH:mm")}
            </p>
          </div>
          {ticket.customerName && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Customer</p>
              <p className="font-medium">{ticket.customerName}</p>
            </div>
          )}
          {ticket.dealershipName && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Dealership</p>
              <p className="font-medium">{ticket.dealershipName}</p>
            </div>
          )}
        </div>

        {/* Public comments */}
        {ticket.comments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Updates from the team
            </h2>
            <div className="space-y-4">
              {ticket.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {c.authorName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(c.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {ticket.history.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Status history
            </h2>
            <div className="space-y-2">
              {ticket.history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 text-xs w-28 flex-shrink-0">
                    {format(new Date(h.changedAt), "MMM d, HH:mm")}
                  </span>
                  <StatusBadge status={h.toStatus} />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Bookmark this page to check your ticket status anytime.
          <br />
          Need to report a new issue?{" "}
          <Link href="/submit" className="text-blue-600 hover:underline">
            Submit another ticket
          </Link>
        </p>
      </div>
    </div>
  );
}
