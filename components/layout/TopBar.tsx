"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import type { Role } from "@prisma/client";

interface TopBarProps {
  userName: string;
  userEmail: string;
  role: Role;
  onMenuClick?: () => void;
}

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  ENGINEER: "Engineer",
  OPERATOR: "Operator",
  SUBMITTER: "Submitter",
};

const roleColors: Record<Role, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  ENGINEER: "bg-blue-100 text-blue-800",
  OPERATOR: "bg-green-100 text-green-800",
  SUBMITTER: "bg-gray-100 text-gray-700",
};

export function TopBar({ userName, userEmail, role, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Badge className={roleColors[role]} variant="outline">
          {roleLabels[role]}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-medium bg-blue-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {userName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
