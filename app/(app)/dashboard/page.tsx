import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
  if (!user || !["ENGINEER", "ADMIN"].includes(user.role)) {
    redirect("/my-tickets");
  }

  const totalTickets = await prisma.ticket.count();

  return (
    <div>
      <PageHeader
        title="Tickets"
        badge={
          <Badge variant="secondary" className="text-sm">
            {totalTickets} total
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <a href="/api/tickets/export" download>
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </a>
            <Link href="/submit" target="_blank">
              <Button size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                New Ticket
              </Button>
            </Link>
          </div>
        }
      />
      <TicketTable role={user.role} currentUserId={user.id} />
    </div>
  );
}
