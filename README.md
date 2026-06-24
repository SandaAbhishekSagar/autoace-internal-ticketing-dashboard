<p align="center">
  <img src="docs/assets/architecture.svg" alt="AutoAce Tickets Architecture" width="100%"/>
</p>

<h1 align="center">AutoAce Tickets</h1>

<p align="center">
  <strong>Internal ticketing for engineering escalations</strong><br/>
  Non-technical users submit → Engineering triages → KPIs & automations keep ops moving
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Railway-Deploy-0B0D0E?style=flat-square&logo=railway&logoColor=white" alt="Railway"/>
  <img src="https://img.shields.io/badge/Linear-Sync-5E6AD2?style=flat-square" alt="Linear"/>
</p>

---

## What it does

```mermaid
flowchart LR
    A["👤 Call monitors<br/>Customers<br/>Vendors"] -->|"/submit"| B["🎫 Ticket"]
    B --> C["📋 Dashboard"]
    C --> D["🔧 Engineer triage"]
    D --> E["📊 KPIs"]
    D --> F["🔗 Linear"]
    B --> G["📧 Email / Slack"]
    B --> H["🔍 Track link"]

    style B fill:#2563eb,color:#fff
    style D fill:#059669,color:#fff
    style E fill:#7c3aed,color:#fff
```

| Problem | Solution |
|---------|----------|
| Non-technical users can't use Linear | Public `/submit` — no login required |
| Engineering needs structure | Dashboard, assign, status, internal notes |
| Urgent issues get lost | P1/P2 → on-call auto-assign + SLA alerts |
| Management needs visibility | `/kpi` dashboard with 9 core metrics |

---

## Ticket lifecycle

<p align="center">
  <img src="docs/assets/ticket-flow.svg" alt="Ticket lifecycle from submit to closed" width="100%"/>
</p>

```mermaid
stateDiagram-v2
    [*] --> NEW: Submit
    NEW --> TRIAGED: Engineer reviews
    TRIAGED --> IN_PROGRESS: Assigned
    IN_PROGRESS --> BLOCKED: Blocked
    BLOCKED --> IN_PROGRESS: Unblocked
    IN_PROGRESS --> RESOLVED: Fixed
    RESOLVED --> CLOSED: Archived
    RESOLVED --> IN_PROGRESS: Reopened

    note right of TRIAGED: Creates Linear issue (AUT-xxx)
    note right of NEW: P1/P2 auto-assigns on-call
```

---

## App map

<p align="center">
  <img src="docs/assets/app-map.svg" alt="Application route map" width="100%"/>
</p>

## Who sees what

<p align="center">
  <img src="docs/assets/roles.svg" alt="Role access matrix" width="100%"/>
</p>

| Page | Public | Submitter | Operator | Engineer | Admin |
|------|:------:|:---------:|:--------:|:--------:|:-----:|
| `/submit` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/track/[token]` | ✅ | — | — | — | — |
| `/my-tickets` | — | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | — | — | 👁️ read-only | ✅ | ✅ |
| `/tickets/[id]` | — | own only | 👁️ | ✅ | ✅ |
| `/kpi` | — | — | — | ✅ | ✅ |
| `/admin/users` | — | — | — | — | ✅ |

---

## SLA at a glance

```mermaid
flowchart LR
    T["Ticket created"] --> W{Severity?}
    W -->|P1| A["4h SLA"]
    W -->|P2| B["8h SLA"]
    W -->|P3| C["24h SLA"]
    W -->|P4| D["No SLA"]
    A & B & C --> R{First response?}
    R -->|No, breached| E["🔴 Red row + Cron escalate"]
    R -->|75% elapsed| F["🟡 Amber row"]
    R -->|Yes| G["✅ OK"]
```

| Severity | Response SLA | Dashboard |
|----------|-------------|-----------|
| 🔴 P1 | 4 hours | Red row when breached |
| 🟠 P2 | 8 hours | Amber at 75% |
| 🟡 P3 | 24 hours | Cron auto-escalates |
| ⚪ P4 | None | — |

---

## Integrations

<p align="center">
  <img src="docs/assets/integrations.svg" alt="Integrations hub" width="100%"/>
</p>

```mermaid
sequenceDiagram
    participant S as Submitter
    participant A as AutoAce
    participant L as Linear
    participant K as Slack

    S->>A: Submit P1 ticket
    A->>K: New ticket alert
    A->>A: Auto-assign on-call
    Note over A: Engineer marks Triaged
    A->>L: Create AUT-123
    L-->>A: Webhook status sync
    A->>S: Email status update
```

All integrations are **optional** — enable with env vars. Details → [docs/DEPLOY.md](docs/DEPLOY.md)

---

## Data model

```mermaid
erDiagram
    User ||--o{ Ticket : submits
    User ||--o{ Ticket : assigned
    User ||--o{ Comment : writes
    Ticket ||--o{ Comment : has
    Ticket ||--o{ StatusHistory : tracks

    User {
        string role
        boolean isOnCall
    }
    Ticket {
        string status
        string severity
        string linearIssueKey
        datetime firstResponseAt
        datetime slaEscalatedAt
    }
    Comment {
        boolean isInternal
    }
```

---

## Tech stack

```mermaid
mindmap
  root((AutoAce Tickets))
    Frontend
      Next.js 14 App Router
      Tailwind + shadcn/ui
      Recharts KPIs
    Backend
      API Routes
      Zod validation
      Server-side RBAC
    Data
      Supabase Postgres
      Prisma ORM
      Supabase Storage
      Supabase Auth
    Deploy
      Railway
      Cron SLA job
    Integrations
      Linear GraphQL
      Slack webhooks
      Resend email
```

---

## Quick start

```bash
git clone <repo>
cd autoace-tickets
cp .env.local.example .env.local   # fill Supabase keys
npm install
npx prisma migrate dev && npx prisma db seed
npm run dev
```

→ **http://localhost:3000** · Public submit at **/submit**

**Production deploy** → see [docs/DEPLOY.md](docs/DEPLOY.md) (Railway + env vars + one-time setup)

---

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@autoace.com` | `Password123!` |
| Engineer | `engineer1@autoace.com` | `Password123!` |
| Operator | `operator1@autoace.com` | `Password123!` |
| Submitter | `submitter1@autoace.com` | `Password123!` |

> Create matching users in **Supabase Auth**, then link `supabaseId` in SQL. See [docs/DEPLOY.md](docs/DEPLOY.md).

---

## KPI dashboard

Nine metrics from the project scope — all live on `/kpi`:

```mermaid
flowchart TB
    subgraph Response["⏱ Response times"]
        A[First response]
        B[Time to triage]
        C[Time to resolve]
    end
    subgraph Quality["📊 Quality"]
        D[SLA breach rate]
        E[Reopen rate]
        F[Escalation rate]
    end
    subgraph Volume["📂 Volume"]
        G[By category]
        H[By customer]
        I[By engineer]
    end
```

---

## Project structure

```
autoace-tickets/
├── app/
│   ├── (public)/submit, login, track   ← no auth
│   ├── (app)/dashboard, kpi, admin     ← authenticated
│   └── api/                            ← REST + webhooks + cron
├── components/                         ← UI + charts
├── lib/                                ← auth, sla, linear, email, slack
├── prisma/                             ← schema + migrations + seed
└── docs/
    ├── DEPLOY.md                       ← full setup guide
    └── assets/*.svg                    ← architecture diagrams
```

---

## What's next

| Priority | Feature |
|----------|---------|
| 🔥 High | AI severity suggestion · Recurring issue detection · Filtered CSV export |
| 📌 Medium | SMS (Twilio) · Call platform webhook · Weekly digest email |
| 🔮 Later | MCP tools for engineers · Configurable SLA UI · Password reset |

---

## Key decisions

| Decision | Why |
|----------|-----|
| Anonymous submit | Zero friction for non-technical users |
| Token tracking `/track/[token]` | Customers see status, not internal notes |
| Linear only after triage | Engineering controls what enters their backlog |
| Server-side RBAC | UI hides buttons; API enforces security |
| Operator = read-only | Call monitors see everything, change nothing |

---

<p align="center">
  <sub>Built for AutoAce · <a href="docs/DEPLOY.md">Deploy guide</a> · <a href="/submit">Try /submit</a></sub>
</p>
