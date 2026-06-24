-- Add on-call flag to User (idempotent — column may already exist from manual SQL)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isOnCall" BOOLEAN NOT NULL DEFAULT false;

-- Add customer tracking token to Ticket
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "trackingToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_trackingToken_key" ON "Ticket"("trackingToken");

-- Add call context fields to Ticket
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "callRecordingUrl" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "callMonitorName" TEXT;
