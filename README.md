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
   | `DATABASE_URL` | Supabase → Settings → Database → Transaction pooler string |
   | `DIRECT_URL` | Supabase → Settings → Database → Session pooler string |
   | `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` locally |

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
# Use the "Transaction" pooler string for DATABASE_URL
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
# Use the "Session" or direct connection string for DIRECT_URL
DIRECT_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:5432/postgres

# Random 32-character string (openssl rand -base64 32)
NEXTAUTH_SECRET=your-32-character-random-secret-here
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
| `/dashboard` | Engineer, Admin | Sortable/filterable ticket table with bulk actions |
| `/tickets/[id]` | Authenticated | Full ticket detail with actions, timeline, comments |
| `/my-tickets` | All roles | Card-based view of submitted issues (non-technical UX) |
| `/kpi` | Engineer, Admin | Operations dashboard with charts and performance tables |
| `/admin/users` | Admin | User management, role changes, invite users |

---

## Roles

| Role | Can Submit | See All Tickets | Triage/Assign | Internal Notes | KPI Dashboard | User Management |
|------|-----------|-----------------|---------------|----------------|---------------|-----------------|
| SUBMITTER | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| OPERATOR | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
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

- Attachment uploads use URL links in v1 (paste a link); Supabase Storage upgrade path is straightforward
- Email notifications scoped out of v1; Supabase Edge Functions or Resend integration is the natural next step
- SLA thresholds are hardcoded (P1=4h, P2=8h, P3=24h); should move to env vars or admin config in v2
- No multi-tenancy in v1; all engineers see all tickets

---

## What I Would Build Next

### High priority (immediate value)
1. **Slack notifications** — Supabase Edge Function triggered on ticket insert/update → Slack webhook for P1/P2 alerts and assignment pings
2. **Linear sync** — Post-triage, auto-create Linear issue and store `linearIssueId` on ticket. Engineers stay in Linear; ticket stays as the non-technical user's view. Status syncs both ways via webhook.
3. **AI severity suggestion** — On `/submit`, after user fills description, call a lightweight LLM endpoint to suggest severity and issue type. Pre-fills the form fields with "AI suggested" label. User can override.

### Medium priority (operational maturity)
4. **Customer portal** — Token-based public URL per ticket. Customer sees sanitized status + public comments only. Internal notes never exposed.
5. **SLA escalation rules** — Supabase cron job checks every 30min. P1 with no response after 4h → auto-ping on-call engineer via Slack DM.
6. **Recurring issue detection** — Embed ticket descriptions via OpenAI. Cluster similar embeddings. Surface "6 similar tickets this month" in ticket detail. Helps engineering spot patterns before they escalate.

### Longer term
7. **Claude/MCP integration** — Expose ticket CRUD as MCP tools so engineers can query ("show me all open P1s") and update tickets from their AI coding workflow without leaving their editor.
8. **Call context linking** — Structured fields for call recording URL, transcript snippet, call monitor name. Auto-populate from call monitoring platform webhook.
9. **Management reporting** — Weekly email digest: SLA performance, top recurring issues, customer health by dealership. Exportable CSV.
