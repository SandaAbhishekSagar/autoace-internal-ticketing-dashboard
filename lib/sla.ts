import type { Severity } from "@prisma/client";

export const SLA_HOURS: Record<Severity, number | null> = {
  P1: 4,
  P2: 8,
  P3: 24,
  P4: null,
};

export function getSLAStatus(
  severity: Severity,
  createdAt: Date,
  firstResponseAt: Date | null
): "breached" | "at_risk" | "ok" {
  const threshold = SLA_HOURS[severity];
  if (threshold === null) return "ok";
  if (firstResponseAt !== null) return "ok";

  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const thresholdMs = threshold * 3_600_000;

  if (elapsedMs > thresholdMs) return "breached";
  if (elapsedMs > thresholdMs * 0.75) return "at_risk";
  return "ok";
}

export function getSLABreachHours(
  severity: Severity,
  createdAt: Date
): number | null {
  const threshold = SLA_HOURS[severity];
  if (threshold === null) return null;
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const elapsedHours = elapsedMs / 3_600_000;
  return Math.round(elapsedHours * 10) / 10;
}
