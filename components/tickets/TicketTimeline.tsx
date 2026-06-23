import { format } from "date-fns";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  label: string;
  description: string;
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
  const steps: TimelineStep[] = [
    { label: "Submitted", description: "Ticket received", date: createdAt },
    { label: "Triaged", description: "Reviewed by team", date: triagedAt },
    { label: "First Response", description: "Engineer responded", date: firstResponseAt },
    { label: "Resolved", description: "Issue fixed", date: resolvedAt },
    { label: "Closed", description: "Confirmed closed", date: closedAt },
  ];

  const lastDoneIdx = steps.reduce((acc, s, i) => (s.date ? i : acc), -1);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const done = !!step.date;
        const isLast = i === steps.length - 1;
        const isCurrentStep = i === lastDoneIdx + 1 && !done;

        return (
          <div key={step.label} className="flex gap-3">
            {/* Left column: icon + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all",
                  done
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                    : isCurrentStep
                    ? "bg-white border-blue-400 text-blue-400"
                    : "bg-white border-gray-200 text-gray-300"
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <Circle className="h-2.5 w-2.5 fill-current" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 my-1 min-h-[20px]",
                    done ? "bg-blue-200" : "bg-gray-100"
                  )}
                />
              )}
            </div>

            {/* Right column: content */}
            <div className={cn("pb-4 min-w-0", isLast && "pb-0")}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    done ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
                {step.date && (
                  <span className="text-xs text-gray-400">
                    {format(new Date(step.date), "MMM d, HH:mm")}
                  </span>
                )}
                {isCurrentStep && (
                  <span className="text-xs font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  done ? "text-gray-500" : "text-gray-300"
                )}
              >
                {done ? step.description : "Pending"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
