import { Badge } from "@/components/ui/badge";
import type { Severity } from "@prisma/client";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const severityConfig: Record<Severity, { label: string; className: string }> = {
  P1: { label: "P1 Critical", className: "bg-red-600 text-white border-red-600" },
  P2: { label: "P2 High", className: "bg-orange-500 text-white border-orange-500" },
  P3: { label: "P3 Medium", className: "bg-yellow-500 text-white border-yellow-500" },
  P4: { label: "P4 Low", className: "bg-gray-400 text-white border-gray-400" },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
