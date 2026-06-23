import { Badge } from "@/components/ui/badge";
import type { IssueType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: IssueType;
  className?: string;
}

const typeConfig: Record<IssueType, { label: string; icon: string; className: string }> = {
  BUG: { label: "Bug", icon: "🐛", className: "bg-purple-100 text-purple-800 border-purple-200" },
  CALL_FAILURE: { label: "Call Failure", icon: "📞", className: "bg-blue-100 text-blue-800 border-blue-200" },
  CUSTOMER_ISSUE: { label: "Customer", icon: "👤", className: "bg-pink-100 text-pink-800 border-pink-200" },
  INTEGRATION: { label: "Integration", icon: "🔗", className: "bg-teal-100 text-teal-800 border-teal-200" },
  OPS_REQUEST: { label: "Ops Request", icon: "⚙️", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const config = typeConfig[type];
  return (
    <Badge
      variant="outline"
      className={cn(config.className, "gap-1", className)}
    >
      <span>{config.icon}</span>
      {config.label}
    </Badge>
  );
}
