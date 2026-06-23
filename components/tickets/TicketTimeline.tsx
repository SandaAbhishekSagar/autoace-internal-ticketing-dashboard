import { format } from "date-fns";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineNode {
  label: string;
  date: Date | null;
}

interface TicketTimelineProps {
  createdAt: Date;
  triagedAt: Date | null;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
}

export function TicketTimeline({
  createdAt,
  triagedAt,
  firstResponseAt,
  resolvedAt,
  closedAt,
}: TicketTimelineProps) {
  const nodes: TimelineNode[] = [
    { label: "Created", date: createdAt },
    { label: "Triaged", date: triagedAt },
    { label: "First Response", date: firstResponseAt },
    { label: "Resolved", date: resolvedAt },
    { label: "Closed", date: closedAt },
  ];

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {nodes.map((node, i) => (
        <div key={node.label} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                node.date
                  ? "bg-green-500 border-green-500 text-white"
                  : "bg-white border-gray-300 text-gray-400"
              )}
            >
              {node.date ? (
                <Check className="h-4 w-4" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              )}
            </div>
            <div className="mt-2 text-center min-w-[90px]">
              <p className="text-xs font-medium text-gray-700">{node.label}</p>
              {node.date ? (
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(new Date(node.date), "MMM d, HH:mm")}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Pending</p>
              )}
            </div>
          </div>
          {i < nodes.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-12 mx-1 mb-8",
                node.date ? "bg-green-400" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
