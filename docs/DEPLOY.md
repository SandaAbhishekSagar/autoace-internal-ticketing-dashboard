# Deploy & Setup (detailed)

Quick visual guide is in the [README](../README.md). This file has step-by-step details.

## Railway deploy

1. Push repo → [railway.app](https://railway.app) → **New Project** → Deploy from GitHub
2. Set variables (see table below)
3. Build: `prisma generate && next build` · Start: `prisma migrate deploy && next start`
4. One-time: `railway run npx prisma db seed`
5. Create Supabase Auth users and link:

```sql
UPDATE "User" SET "supabaseId" = '<auth-uuid>' WHERE email = 'admin@autoace.com';
```

## Environment variables

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase → Settings → API |
| `DATABASE_URL` | ✅ | Supabase → Connect → Prisma → **Transaction** pooler (6543) |
| `DIRECT_URL` | ✅ | Supabase → Connect → Prisma → **Session** pooler (5432) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Railway public domain |
| `RESEND_API_KEY` | optional | [resend.com](https://resend.com) |
| `EMAIL_FROM` | optional | Sender address |
| `SLACK_WEBHOOK_URL` | optional | Slack incoming webhook |
| `CRON_SECRET` | optional | `openssl rand -base64 32` |
| `LINEAR_API_KEY` | optional | Linear personal API key |
| `LINEAR_TEAM_ID` | optional | `AUT` or team UUID |
| `LINEAR_WEBHOOK_SECRET` | optional | Linear webhook signing secret |

## Fix P1001 (database unreachable)

Do **not** use `db.xxx.supabase.co` for `DIRECT_URL` on Railway.

Use the **Session pooler** (port 5432) from Supabase → Connect → ORMs → Prisma.

## SLA cron (separate Railway service)

Schedule: `*/30 * * * *`

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" $NEXT_PUBLIC_APP_URL/api/cron/sla-escalation
```

## Linear

1. `LINEAR_TEAM_ID=AUT` (AutoAce ticketing team)
2. Engineer marks ticket **Triaged** → creates `AUT-xxx` in Linear
3. Webhook: `https://YOUR_APP/api/webhooks/linear` with `LINEAR_WEBHOOK_SECRET`

## Attachments bucket

Run once in Supabase SQL Editor (`supabase/storage-setup.sql`):

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ticket-attachments', 'ticket-attachments', true, 10485760)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit;
```

## Local dev

```bash
cp .env.local.example .env.local
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open http://localhost:3000
