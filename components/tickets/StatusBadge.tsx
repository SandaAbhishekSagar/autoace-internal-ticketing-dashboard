import type { Status } from "@prisma/client";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<
  Status,
  { label: string; dot: string; bg: string; text: string; ring: string }
> = {
  NEW: {
    label: "New",
    dot: "bg-slate-400",
    bg: "bg-slate-50",
    text: "text-slate-700",
    ring: "ring-slate-200",
  },
  TRIAGED: {
    label: "Triaged",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dot: "bg-indigo-500 animate-pulse",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
  },
  BLOCKED: {
    label: "Blocked",
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
  },
  RESOLVED: {
    label: "Resolved",
    dot: "bg-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    ring: "ring-green-200",
  },
  CLOSED: {
    label: "Closed",
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
    ring: "ring-gray-200",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const c = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1",
        c.bg,
        c.text,
        c.ring,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
      {c.label}
    </span>
  );
}
