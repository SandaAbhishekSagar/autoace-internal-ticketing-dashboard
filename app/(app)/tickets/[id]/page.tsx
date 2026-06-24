import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSLAStatus } from "@/lib/sla";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { TicketTimeline } from "@/components/tickets/TicketTimeline";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { SeverityBadge } from "@/components/tickets/SeverityBadge";
import { TypeBadge } from "@/components/tickets/TypeBadge";
import { SLABanner } from "@/components/tickets/SLABanner";
import { StatusHistoryList } from "@/components/tickets/StatusHistoryList";
import { TicketActions } from "@/components/tickets/TicketActions";
import { CommentThread } from "@/components/tickets/CommentThread";
import { ChevronRight, Paperclip, Phone, ExternalLink } from "lucide-react";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: { title: true, shortId: true },
  });
  return {
    title: ticket
      ? `#${String(ticket.shortId).padStart(3, "0")} ${ticket.title} — AutoAce`
      : "Ticket",
  };
}

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isEngineerOrAdmin = ["ENGINEER", "ADMIN"].includes(user.role);

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      assignee: { select: { id: true, name: true } },
      submitter: { select: { id: true, name: true, email: true } },
      comments: {
        where: isEngineerOrAdmin ? {} : { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { role: true } } },
      },
      history: {
        orderBy: { changedAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
    },
  });

  if (!ticket) notFound();

  const slaStatus = getSLAStatus(ticket.severity, ticket.createdAt, ticket.firstResponseAt);
  const shortIdStr = String(ticket.shortId).padStart(3, "0");

  const engineers = await prisma.user.findMany({
    where: { role: { in: ["ENGINEER", "ADMIN"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-5">
        <Link href="/dashboard" className="hover:text-gray-900">
          Tickets
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">#{shortIdStr}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel */}
        <div className="flex-1 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-sm text-gray-400 font-mono">#{shortIdStr}</span>
              <SeverityBadge severity={ticket.severity} />
              <StatusBadge status={ticket.status} />
              <TypeBadge type={ticket.issueType} />
            </div>
          </div>

          {slaStatus !== "ok" && (
            <SLABanner
              severity={ticket.severity}
              createdAt={ticket.createdAt}
              firstResponseAt={ticket.firstResponseAt}
            />
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
              <div>
                <p className="text-gray-500">Submitted by</p>
                <p className="font-medium">{ticket.submitterName}</p>
                <p className="text-gray-500 text-xs">{ticket.submitterEmail}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p
                  className="font-medium"
                  title={format(ticket.createdAt, "PPpp")}
                >
                  {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                </p>
                <p className="text-gray-400 text-xs">
                  {format(ticket.createdAt, "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{ticket.customerName || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Dealership</p>
                <p className="font-medium">{ticket.dealershipName || "—"}</p>
              </div>
              {ticket.links.length > 0 && (
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Links</p>
                  <div className="space-y-1">
                    {ticket.links.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 hover:underline text-sm truncate"
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            {ticket.attachmentUrls.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4" /> Attachments
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachmentUrls.map((url, i) => {
                    const filename = url.split("/").pop()?.replace(/^\d+_/, "") ?? `file-${i + 1}`;
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                    return isImage ? (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={filename} className="h-24 w-36 object-cover" />
                        <p className="text-xs text-gray-500 px-2 py-1 truncate max-w-[144px]">{filename}</p>
                      </a>
                    ) : (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors">
                        <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{filename}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Call context */}
            {(ticket.callRecordingUrl || ticket.callMonitorName) && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Phone className="h-4 w-4" /> Call Context
                </h3>
                <div className="space-y-2 text-sm">
                  {ticket.callRecordingUrl && (
                    <a href={ticket.callRecordingUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:underline">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      Call recording
                    </a>
                  )}
                  {ticket.callMonitorName && (
                    <p className="text-gray-700">
                      Reviewed by <span className="font-medium">{ticket.callMonitorName}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
              <TicketTimeline
                createdAt={ticket.createdAt}
                triagedAt={ticket.triagedAt}
                firstResponseAt={ticket.firstResponseAt}
                resolvedAt={ticket.resolvedAt}
                closedAt={ticket.closedAt}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
          <StatusHistoryList history={ticket.history as Parameters<typeof StatusHistoryList>[0]["history"]} />
        </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <CommentThread
              ticketId={ticket.id}
              comments={ticket.comments as Parameters<typeof CommentThread>[0]["comments"]}
              role={user.role}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <TicketActions
            ticket={{
              id: ticket.id,
              status: ticket.status,
              severity: ticket.severity,
              priority: ticket.priority,
              assigneeId: ticket.assigneeId,
              issueType: ticket.issueType,
            }}
            engineers={engineers}
            role={user.role}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
