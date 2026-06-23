import { AlertTriangle, Clock } from "lucide-react";
import { getSLAStatus, getSLABreachHours } from "@/lib/sla";
import type { Severity } from "@prisma/client";

interface SLABannerProps {
  severity: Severity;
  createdAt: Date;
  firstResponseAt: Date | null;
}

export function SLABanner({ severity, createdAt, firstResponseAt }: SLABannerProps) {
  const status = getSLAStatus(severity, createdAt, firstResponseAt);
  if (status === "ok") return null;

  const hours = getSLABreachHours(severity, createdAt);

  if (status === "breached") {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <p className="font-semibold">SLA Breached</p>
          <p className="text-sm">
            This {severity} ticket has been open for {hours} hours without a first response.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
      <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold">SLA At Risk</p>
        <p className="text-sm">
          This {severity} ticket has been open for {hours} hours. Response needed soon.
        </p>
      </div>
    </div>
  );
}
