"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Users,
  PlusCircle,
  ListChecks,
} from "lucide-react";

interface SidebarProps {
  role: Role;
  userName: string;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ENGINEER", "ADMIN"] as Role[],
  },
  {
    href: "/my-tickets",
    label: "My Issues",
    icon: ListChecks,
    roles: ["SUBMITTER", "OPERATOR"] as Role[],
  },
  {
    href: "/tickets",
    label: "All Tickets",
    icon: Ticket,
    roles: ["ENGINEER", "ADMIN"] as Role[],
  },
  {
    href: "/kpi",
    label: "KPI Dashboard",
    icon: BarChart3,
    roles: ["ENGINEER", "ADMIN"] as Role[],
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: Users,
    roles: ["ADMIN"] as Role[],
  },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const visible = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-semibold text-white">AutoAce Tickets</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-gray-700 mt-4">
          <Link
            href="/submit"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Submit New Issue
          </Link>
        </div>
      </nav>
    </aside>
  );
}
