-- Run once in Supabase → SQL Editor to enable ticket file attachments.
-- Creates a public bucket with a 10 MB per-file limit (matches the app).

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ticket-attachments', 'ticket-attachments', true, 10485760)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;
