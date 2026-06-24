import { redirect } from "next/navigation";
import { getCurrentUser, ENGINEER_AND_ABOVE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { TicketTable } from "@/components/tickets/TicketTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Dashboard — AutoAce Tickets" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !["ENGINEER", "ADMIN", "OPERATOR"].includes(user.role)) {
    redirect("/my-tickets");
  }

  const isReadOnly = user.role === "OPERATOR";
  const canExport = ENGINEER_AND_ABOVE.includes(user.role);
  const totalTickets = await prisma.ticket.count();

  return (
    <div>
      <PageHeader
        title={isReadOnly ? "All Tickets" : "Tickets"}
        badge={
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <Badge variant="outline" className="text-xs text-gray-600">
                Read-only
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              {totalTickets} total
            </Badge>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            {canExport && (
              <a href="/api/tickets/export" download>
                <Button size="sm" variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </a>
            )}
            <Link href="/submit" target="_blank">
              <Button size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                New Ticket
              </Button>
            </Link>
          </div>
        }
      />
      <TicketTable role={user.role} currentUserId={user.id} readOnly={isReadOnly} />
    </div>
  );
}
