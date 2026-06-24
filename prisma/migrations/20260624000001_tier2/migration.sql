-- Linear integration + SLA auto-escalation tracking
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "linearIssueId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "linearIssueKey" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "linearIssueUrl" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_linearIssueId_key" ON "Ticket"("linearIssueId");

ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "slaEscalatedAt" TIMESTAMP(3);
