import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { KPIDashboard } from "@/components/kpi/KPIDashboard";

export const metadata = { title: "Operations Dashboard — AutoAce Tickets" };

export default async function KPIPage() {
  const user = await getCurrentUser();
  if (!user || !["ENGINEER", "ADMIN"].includes(user.role)) {
    redirect("/my-tickets");
  }

  return <KPIDashboard />;
}
