# AutoAce Tickets

> Internal ticketing system for engineering escalations at AutoAce — bridging non-technical users (call monitors, vendors, customers, dealership staff) with the engineering team.

---

## Deploy to Railway

> One-click deploy: push to GitHub, connect to Railway, set env vars, done.

### Steps

1. **Push this repo to GitHub** (or GitLab / Bitbucket)

2. **Create a new Railway project**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
   - Select your repository

3. **Set environment variables** in Railway → Settings → Variables:

   | Variable | Where to get it |
   |----------|----------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
   | `DATABASE_URL` | Supabase → **Connect** → **ORMs** → Prisma → **Transaction pooler** (port **6543**) |
   | `DIRECT_URL` | Supabase → **Connect** → **ORMs** → Prisma → **Session pooler** (port **5432**) — **not** the `db.xxx.supabase.co` direct host |
   | `NEXT_PUBLIC_APP_URL` | Your Railway public domain (e.g. `https://xxx.up.railway.app`) |
   | `RESEND_API_KEY` | Optional — [resend.com](https://resend.com) for email notifications |
   | `EMAIL_FROM` | Optional — sender address for Resend |
   | `SLACK_WEBHOOK_URL` | Optional — Slack incoming webhook for P1/P2 alerts |
   | `CRON_SECRET` | Optional — secures `/api/cron/sla-escalation` (Railway cron) |
   | `LINEAR_API_KEY` | Optional — Linear personal API key for issue sync on triage |
   | `LINEAR_TEAM_ID` | Optional — Linear team UUID |
   | `LINEAR_WEBHOOK_SECRET` | Optional — verifies Linear webhook at `/api/webhooks/linear` |

4. **Railway auto-deploys.** The build runs `prisma generate && next build`, then `prisma migrate deploy && next start`.

5. **Seed data** (run once after first deploy):
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   railway login
   railway run npx prisma db seed
   ```

6. **Create Supabase Auth users** for the demo accounts (see [Demo Accounts](#demo-accounts) below), then link them to the seeded DB users:
   ```sql
   -- In Supabase SQL editor, after creating each Auth user
   UPDATE "User" SET "supabaseId" = '<auth-user-uuid>' WHERE email = 'admin@autoace.com';
   UPDATE "User" SET "supabaseId" = '<auth-user-uuid>' WHERE email = 'engineer1@autoace.com';
   -- repeat for all 8 users
   ```

> **Note:** Railway automatically sets `PORT` and `RAILWAY_PUBLIC_DOMAIN`. The app reads these from `next.config.mjs`.

### Railway troubleshooting: `P1001 Can't reach database server`

If deploy logs show Prisma connecting to `db.<ref>.supabase.co:5432` and failing with **P1001**, your `DIRECT_URL` is wrong for Railway.

**Do not use** the Supabase "Direct connection" host (`db.xxx.supabase.co`) — it is often IPv6-only and unreachable from Railway.

**Use the Session pooler instead** (same place you copied `DATABASE_URL`, but pick **Session** mode, port **5432**):

| Variable | Host | Port | Username format |
|----------|------|------|-----------------|
| `DATABASE_URL` | `aws-1-us-west-2.pooler.supabase.com` | 6543 | `postgres.<project-ref>` |
| `DIRECT_URL` | `aws-1-us-west-2.pooler.supabase.com` | 5432 | `postgres.<project-ref>` |

Example for project `cmakemhozygakhomxmrb`:

```
DATABASE_URL=postgresql://postgres.cmakemhozygakhomxmrb:YOUR_PASSWORD@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.cmakemhozygakhomxmrb:YOUR_PASSWORD@aws-1-us-west-2.pooler.supabase.com:5432/postgres
```

In Supabase dashboard: **Connect** → **ORMs** → **Prisma** — copy both strings from there. Update both vars in Railway → **Variables**, then redeploy.

### SLA auto-escalation cron (optional)

Add a Railway cron job to check for breached SLAs every 30 minutes:

1. Set `CRON_SECRET` in Railway variables (`openssl rand -base64 32`)
2. In Railway → your service → **Cron** → add schedule `*/30 * * * *`
3. Command: `curl -s -H "Authorization: Bearer $CRON_SECRET" https://YOUR_APP_URL/api/cron/sla-escalation`

Breached P1/P2/P3 tickets with no first response get a Slack alert and an internal system note (once per ticket).

### Linear integration (optional)

1. Set `LINEAR_API_KEY` and `LINEAR_TEAM_ID` in Railway variables
2. When an engineer marks a ticket **Triaged**, a Linear issue is created automatically
3. Create a Linear webhook pointing to `https://YOUR_APP_URL/api/webhooks/linear` with header `linear-signature: YOUR_LINEAR_WEBHOOK_SECRET`
4. Status changes in Linear sync back to AutoAce tickets

---

## Quick Start

### Option A — Local with Supabase Cloud (recommended)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your Project URL, anon key, and service role key
3. Go to **Settings → Database** and copy the connection strings

```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials (see below)
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Option B — Fully local with Docker (Supabase CLI)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase stack
supabase start

# Copy local credentials from the output above
cp .env.local.example .env.local
# Fill in local credentials from `supabase status`

npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
# From Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# From Supabase Dashboard → Settings → Database → Connection string
# Use the "Transaction" pooler string for DATABASE_URL (port 6543)
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
# Use the "Session" pooler string for DIRECT_URL (port 5432) — NOT db.xxxx.supabase.co
DIRECT_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:5432/postgres

# Random 32-character string for cron auth (openssl rand -base64 32)
CRON_SECRET=your-cron-secret-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (optional)
RESEND_API_KEY=
EMAIL_FROM=AutoAce Support <tickets@autoace.com>

# Slack (optional)
SLACK_WEBHOOK_URL=

# Linear (optional)
LINEAR_API_KEY=
LINEAR_TEAM_ID=
LINEAR_WEBHOOK_SECRET=
```

---

## Setting Up Demo Accounts

After running `npx prisma db seed`, create matching Supabase Auth users so you can log in.

**Option 1: Supabase Dashboard**
1. Go to **Authentication → Users** in your Supabase dashboard
2. Click **Add user** for each account below
3. After creating each user, run this SQL in the Supabase SQL editor to link them:

```sql
-- Run for each user after creating them in Auth
-- Replace the email and UUID with the actual values
UPDATE "User"
SET "supabaseId" = 'auth-user-uuid-here'
WHERE email = 'admin@autoace.com';
```

**Option 2: Use the seed script with Supabase service role**
The seed script creates database records. To also create Supabase Auth users programmatically, you can extend `prisma/seed.ts` using the `createSupabaseServiceClient()` from `lib/supabase/server.ts`.

---

## Demo Accounts

| Role       | Email                   | Password      |
|------------|-------------------------|---------------|
| Admin      | admin@autoace.com       | Password123!  |
| Engineer   | engineer1@autoace.com   | Password123!  |
| Engineer   | engineer2@autoace.com   | Password123!  |
| Engineer   | engineer3@autoace.com   | Password123!  |
| Operator   | operator1@autoace.com   | Password123!  |
| Operator   | operator2@autoace.com   | Password123!  |
| Submitter  | submitter1@autoace.com  | Password123!  |
| Submitter  | submitter2@autoace.com  | Password123!  |

**Public ticket submission (no login required):** [/submit](/submit)

---

## Pages & Features

| Page | Access | Description |
|------|--------|-------------|
| `/submit` | Public | Friendly form for non-technical users to report issues |
| `/login` | Public | Email/password sign-in |
| `/dashboard` | Operator (read-only), Engineer, Admin | Sortable/filterable ticket table; operators can view all tickets but cannot triage |
| `/tickets/[id]` | Authenticated | Full ticket detail with actions, timeline, comments |
| `/my-tickets` | All roles | Card-based view of submitted issues (non-technical UX) |
| `/kpi` | Engineer, Admin | Operations dashboard with charts and performance tables |
| `/admin/users` | Admin | User management, role changes, invite users |

---

## Roles

| Role | Can Submit | See All Tickets | Triage/Assign | Internal Notes | KPI Dashboard | User Management |
|------|-----------|-----------------|---------------|----------------|---------------|-----------------|
| SUBMITTER | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| OPERATOR | ✅ | ✅ (read-only) | ❌ | ❌ | ❌ | ❌ |
| ENGINEER | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

All role checks are enforced server-side on every API route.

---

## SLA Thresholds

| Severity | Threshold | Description |
|----------|-----------|-------------|
| P1 — Critical | 4 hours | System down or customer blocked |
| P2 — High | 8 hours | Major issue, no workaround |
| P3 — Medium | 24 hours | Workaround exists |
| P4 — Low | None | Minor inconvenience |

- Tickets past threshold with no first response show a **red row** on the dashboard
- Tickets at 75% of threshold show an **amber row**
- SLA breach banner shown on ticket detail page

---

## Architecture Decisions

**Why Supabase over raw Postgres?**
Supabase provides managed PostgreSQL + Auth + Storage as one platform, reducing setup time significantly. Prisma sits on top for type-safe queries. The system is fully portable — standard pg schema, exportable anytime.

**Why Prisma + Supabase together?**
Supabase client handles Auth and realtime. Prisma handles all data queries with type safety and relation loading. This separation keeps data access clean and testable.

**Why anonymous ticket submission?**
Requiring account creation before submission adds friction that kills adoption for non-technical users. Name + email is captured for follow-up. Logged-in submitters get the `/my-tickets` tracker as a bonus.

**Role enforcement approach**
Roles are stored in the `User` table and checked server-side on every API route using the Supabase service role key (bypasses RLS, trusted server-side only). Client-side role checks only affect UI visibility — never security.

---

## Assumptions

- File attachments use Supabase Storage (`ticket-attachments` bucket, public read)
- Email (Resend) and Slack notifications are optional — enabled via env vars
- SLA thresholds are hardcoded (P1=4h, P2=8h, P3=24h); configurable via env in a future version
- Operators have read-only access to all tickets; engineers/admins can triage and assign
- Linear sync is optional — creates a Linear issue when a ticket moves to TRIAGED
- SLA auto-escalation runs via Railway cron hitting `/api/cron/sla-escalation` every 30 minutes

---

## What I Would Build Next

### High priority
1. **AI severity suggestion** — On `/submit`, suggest severity and issue type from description
2. **Recurring issue detection** — Embed descriptions and cluster similar tickets
3. **Filtered CSV export** — Export respects active dashboard filters

### Medium priority
4. **SMS notifications** — Twilio alerts for P1 on-call
5. **Call platform webhook** — Auto-populate call recording URL from monitoring system
6. **Weekly management digest** — Email summary of SLA performance and top issues

### Longer term
7. **Claude/MCP integration** — Ticket CRUD as MCP tools for AI coding workflows
8. **Configurable SLA thresholds** — Admin UI or env-based SLA rules
9. **Password reset / self-service** — Supabase magic link flow
