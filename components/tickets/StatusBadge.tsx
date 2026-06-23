import { Badge } from "@/components/ui/badge";
import type { Status } from "@prisma/client";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  NEW: { label: "New", className: "border-slate-400 text-slate-700 bg-slate-50" },
  TRIAGED: { label: "Triaged", className: "border-blue-400 text-blue-700 bg-blue-50" },
  IN_PROGRESS: { label: "In Progress", className: "border-indigo-400 text-indigo-700 bg-indigo-50" },
  BLOCKED: { label: "Blocked", className: "border-red-400 text-red-700 bg-red-50" },
  RESOLVED: { label: "Resolved", className: "border-green-400 text-green-700 bg-green-50" },
  CLOSED: { label: "Closed", className: "border-gray-400 text-gray-600 bg-gray-50" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
