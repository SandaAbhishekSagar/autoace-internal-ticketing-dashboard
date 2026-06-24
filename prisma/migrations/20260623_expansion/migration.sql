-- Add on-call flag to User
ALTER TABLE "User" ADD COLUMN "isOnCall" BOOLEAN NOT NULL DEFAULT false;

-- Add customer tracking token to Ticket
ALTER TABLE "Ticket" ADD COLUMN "trackingToken" TEXT;
CREATE UNIQUE INDEX "Ticket_trackingToken_key" ON "Ticket"("trackingToken");

-- Add call context fields to Ticket
ALTER TABLE "Ticket" ADD COLUMN "callRecordingUrl" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "callMonitorName" TEXT;
