"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Ticket,
  BarChart3,
  Users,
  PlusCircle,
  ListChecks,
  LogOut,
  HelpCircle,
  X,
  PhoneCall,
} from "lucide-react";

interface SidebarProps {
  role: Role;
  userName: string;
  userEmail: string;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
  description?: string;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "All Tickets",
    icon: Ticket,
    roles: ["ENGINEER", "ADMIN"],
    description: "View and manage all tickets",
  },
  {
    href: "/kpi",
    label: "KPI Dashboard",
    icon: BarChart3,
    roles: ["ENGINEER", "ADMIN"],
    description: "Team performance metrics",
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: Users,
    roles: ["ADMIN"],
    description: "Invite and manage team members",
  },
  {
    href: "/my-tickets",
    label: "My Issues",
    icon: ListChecks,
    roles: ["SUBMITTER", "OPERATOR"],
    description: "Track your submitted issues",
  },
];

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  ENGINEER: "Engineer",
  OPERATOR: "Operator",
  SUBMITTER: "Submitter",
};

const roleBadgeColors: Record<Role, string> = {
  ADMIN: "bg-purple-500/20 text-purple-300",
  ENGINEER: "bg-blue-500/20 text-blue-300",
  OPERATOR: "bg-green-500/20 text-green-300",
  SUBMITTER: "bg-gray-500/20 text-gray-300",
};

export function Sidebar({ role, userName, userEmail, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [onCallName, setOnCallName] = useState<string | null>(null);

  useEffect(() => {
    if (!["ENGINEER", "ADMIN"].includes(role)) return;
    fetch("/api/oncall")
      .then((r) => r.json())
      .then((data) => setOnCallName(data.onCall?.name ?? null))
      .catch(() => {});
  }, [role]);

  const visible = navItems.filter((item) => item.roles.includes(role));

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            A
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">AutoAce Tickets</p>
            <p className="text-[10px] text-gray-400 leading-tight">Internal Support</p>
          </div>
        </div>
        {/* Close button — only on mobile */}
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-white p-1 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
          </div>
        </div>
        <span className={cn("mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full", roleBadgeColors[role])}>
          {roleLabels[role]}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
          Navigation
        </p>
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Submit a ticket — shown for all roles */}
        <div className="pt-3 mt-2 border-t border-gray-700/60">
          <p className="px-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            Actions
          </p>
          <Link
            href="/submit"
            target="_blank"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <PlusCircle className="h-4 w-4 flex-shrink-0" />
            Submit New Ticket
          </Link>

          {/* Help link for submitters/operators */}
          {(role === "SUBMITTER" || role === "OPERATOR") && (
            <div className="mt-3 mx-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-200">Need help?</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    Use the form to report issues. Your team will respond via this portal.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* On-call status — engineers/admins only */}
      {["ENGINEER", "ADMIN"].includes(role) && (
        <div className="px-3 py-2 border-t border-gray-700/60">
          <Link href="/admin/users" onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group">
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              onCallName ? "bg-green-400 animate-pulse" : "bg-gray-500"
            )} />
            <PhoneCall className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold leading-tight">On-call</p>
              <p className="text-xs text-gray-300 truncate leading-tight">
                {onCallName ?? "No one assigned"}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-gray-700/60">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
