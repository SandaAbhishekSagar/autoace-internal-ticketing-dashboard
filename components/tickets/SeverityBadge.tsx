import type { Severity } from "@prisma/client";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const severityConfig: Record<
  Severity,
  { label: string; bg: string; text: string; border: string }
> = {
  P1: {
    label: "P1 · Critical",
    bg: "bg-red-600",
    text: "text-white",
    border: "border-red-700",
  },
  P2: {
    label: "P2 · High",
    bg: "bg-orange-500",
    text: "text-white",
    border: "border-orange-600",
  },
  P3: {
    label: "P3 · Medium",
    bg: "bg-amber-400",
    text: "text-amber-900",
    border: "border-amber-500",
  },
  P4: {
    label: "P4 · Low",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const c = severityConfig[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border",
        c.bg,
        c.text,
        c.border,
        className
      )}
    >
      {c.label}
    </span>
  );
}
