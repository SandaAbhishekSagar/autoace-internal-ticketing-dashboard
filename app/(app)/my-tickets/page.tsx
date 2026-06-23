import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MyTicketsList } from "@/components/tickets/MyTicketsList";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "My Issues — AutoAce Tickets" };

export default async function MyTicketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader
        title="My Submitted Issues"
        action={
          <Link href="/submit" target="_blank">
            <Button size="sm">Report a new issue →</Button>
          </Link>
        }
      />
      <MyTicketsList userId={user.id} role={user.role} />
    </div>
  );
}
