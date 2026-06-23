import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserManagement } from "@/components/admin/UserManagement";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = { title: "User Management — AutoAce Tickets" };

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage team members and their access levels"
      />
      <UserManagement />
    </div>
  );
}
