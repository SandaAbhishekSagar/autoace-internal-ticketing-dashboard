import { cn } from "@/lib/utils";

interface KPISummaryCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}

export function KPISummaryCard({
  label,
  value,
  subtext,
  highlight,
  icon,
}: KPISummaryCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border p-5 shadow-sm",
        highlight ? "border-red-300 bg-red-50" : "border-gray-200"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p
        className={cn(
          "text-3xl font-bold",
          highlight ? "text-red-700" : "text-gray-900"
        )}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      )}
    </div>
  );
}
