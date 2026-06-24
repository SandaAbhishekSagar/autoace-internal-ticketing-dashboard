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
  <img src="https://img.shields.io/badge/Slack-Alerts-4A154B?style=flat-square&logo=slack&logoColor=white" alt="Slack"/>
</p>

<p align="center">
  <a href="https://join.slack.com/t/autoaceticket-vts9935/shared_invite/zt-41t6ctnmr-3nFERfqFdNBnHrSzwFUQoA"><strong>Join Slack workspace →</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/DEPLOY.md">Deploy guide</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/SandaAbhishekSagar/autoace-internal-ticketing-dashboard">GitHub</a>
</p>

---

## Architecture

```mermaid
flowchart TB
    subgraph Users["👥 Users"]
        U1["Call monitors"]
        U2["Customers & vendors"]
        U3["Operators · Engineers · Admins"]
    end

    subgraph App["⚡ Next.js 14 on Railway"]
        WEB["Pages: /submit · /dashboard · /kpi"]
        API["API Routes + Webhooks + Cron"]
        PRISMA["Prisma ORM"]
    end

    subgraph Supabase["🗄️ Supabase"]
        AUTH["Auth"]
        DB["Postgres"]
        STORE["Storage · attachments"]
    end

    subgraph External["🔌 Integrations (optional)"]
        LIN["Linear AUT-xxx"]
        SLK["Slack alerts"]
        EM["Resend email"]
    end

    U1 & U2 -->|"/submit · /track"| WEB
    U3 -->|login| WEB
    WEB --> API --> PRISMA --> DB
    API --> AUTH
    API --> STORE
    API --> LIN & SLK & EM

    style App fill:#1e3a5f,color:#fff
    style Supabase fill:#14532d,color:#fff
    style External fill:#312e81,color:#fff
```

| Problem | Solution |
|---------|----------|
| Non-technical users can't use Linear | Public `/submit` — no login required |
| Engineering needs structure | Dashboard, assign, status, internal notes |
| Urgent issues get lost | P1/P2 → on-call auto-assign + SLA alerts |
| Management needs visibility | `/kpi` dashboard with 9 core metrics |

---

## Ticket lifecycle

```mermaid
flowchart LR
    S(["/submit"]) --> NEW
    NEW -->|"P1/P2"| OC["On-call assign"]
    OC --> TRIAGED
    NEW --> TRIAGED
    TRIAGED -->|"creates"| LIN["Linear AUT-xxx"]
    TRIAGED --> IN_PROGRESS
    IN_PROGRESS <--> BLOCKED
    IN_PROGRESS --> RESOLVED
    RESOLVED --> CLOSED
    RESOLVED -.->|reopen| IN_PROGRESS

    style NEW fill:#fef3c7,stroke:#d97706
    style TRIAGED fill:#e0e7ff,stroke:#4f46e5
    style IN_PROGRESS fill:#d1fae5,stroke:#059669
    style RESOLVED fill:#dcfce7,stroke:#16a34a
    style CLOSED fill:#f1f5f9,stroke:#64748b
```

| Status | Meaning |
|--------|---------|
| **NEW** | Just submitted · P1/P2 auto-routes to on-call |
| **TRIAGED** | Reviewed · Linear issue created |
| **IN_PROGRESS** | Engineer actively working |
| **BLOCKED** | Waiting on dependency |
| **RESOLVED** | Fix deployed · submitter notified |
| **CLOSED** | Archived |

---

## App map & roles

```mermaid
flowchart TB
    subgraph Public["🌐 Public — no login"]
        P1["/submit"]
        P2["/login"]
        P3["/track/token"]
    end

    subgraph AllRoles["👤 All authenticated roles"]
        A1["/my-tickets"]
        A2["/tickets/id"]
    end

    subgraph Eng["🔧 Engineer + Admin"]
        E1["/dashboard"]
        E2["/kpi"]
        E3["CSV export"]
    end

    subgraph AdminOnly["⚙️ Admin only"]
        AD1["/admin/users"]
        AD2["On-call toggle"]
    end

    Public --> AllRoles
    AllRoles --> Eng
    Eng --> AdminOnly
```

| Page | Public | Submitter | Operator | Engineer | Admin |
|------|:------:|:---------:|:--------:|:--------:|:-----:|
| `/submit` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/track/[token]` | ✅ | — | — | — | — |
| `/my-tickets` | — | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | — | — | 👁️ read-only | ✅ | ✅ |
| `/tickets/[id]` | — | own only | 👁️ | ✅ | ✅ |
| `/kpi` | — | — | — | ✅ | ✅ |
| `/admin/users` | — | — | — | — | ✅ |

```mermaid
flowchart LR
    subgraph Access["Permission level"]
        direction TB
        SUB["Submitter<br/>submit + own tickets"]
        OP["Operator<br/>+ view all read-only"]
        ENG["Engineer<br/>+ triage · KPI · notes"]
        ADM["Admin<br/>+ user mgmt · on-call"]
    end
    SUB --> OP --> ENG --> ADM
```

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
    R -->|breached| E["🔴 Red row + cron escalate"]
    R -->|75% elapsed| F["🟡 Amber row"]
    R -->|yes| G["✅ OK"]
```

| Severity | Response SLA | Dashboard |
|----------|-------------|-----------|
| 🔴 P1 | 4 hours | Red row when breached |
| 🟠 P2 | 8 hours | Amber at 75% |
| 🟡 P3 | 24 hours | Cron auto-escalates |
| ⚪ P4 | None | — |

---

## Integrations

```mermaid
flowchart LR
    APP["AutoAce Tickets"]

    APP -->|"Triaged"| LIN["Linear<br/>AUT-xxx"]
    LIN -->|"webhook"| APP

    APP --> SLK["Slack<br/>P1/P2 · assign · SLA"]
    APP --> EM["Resend<br/>confirm · status"]
    APP --> CRON["Railway Cron<br/>SLA escalation"]
    APP --> STOR["Supabase Storage<br/>attachments"]

    style APP fill:#2563eb,color:#fff
```

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

| Integration | Env var | Trigger |
|-------------|---------|---------|
| **Slack** | `SLACK_WEBHOOK_URL` | New P1/P2, assign, SLA breach, escalate |
| **Email** | `RESEND_API_KEY` | Confirm, status change, assignment |
| **Linear** | `LINEAR_API_KEY` + `LINEAR_TEAM_ID=AUT` | Status → Triaged |
| **Linear webhook** | `LINEAR_WEBHOOK_SECRET` | Status sync back |
| **SLA cron** | `CRON_SECRET` | Every 30 min via Railway |

**Slack workspace:** [Join AutoAce Ticket Slack](https://join.slack.com/t/autoaceticket-vts9935/shared_invite/zt-41t6ctnmr-3nFERfqFdNBnHrSzwFUQoA)

Full setup → [docs/DEPLOY.md](docs/DEPLOY.md)

---

## Features

```mermaid
mindmap
  root((AutoAce))
    Submit
      No login required
      Attachments
      Call context
      Duplicate hints
      Tracking token
    Triage
      Assign owner
      Internal notes
      Bulk actions
      Manual escalate
      Linear sync
    Automations
      On-call routing
      SLA cron
      Email + Slack
    Reporting
      9 KPI metrics
      CSV export
      Engineer tables
      Customer tables
```

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

| Layer | Tools |
|-------|-------|
| Frontend | Next.js 14 · Tailwind · shadcn/ui · Recharts |
| Backend | API Routes · Zod · server-side RBAC |
| Data | Supabase Postgres · Prisma · Supabase Auth · Storage |
| Deploy | Railway · Prisma migrate on start |
| Integrations | Linear GraphQL · Slack webhooks · Resend |

---

## Quick start

```bash
git clone https://github.com/SandaAbhishekSagar/autoace-internal-ticketing-dashboard.git
cd autoace-tickets
cp .env.local.example .env.local   # fill Supabase keys
npm install
npx prisma migrate dev && npx prisma db seed
npm run dev
```

→ **http://localhost:3000** · Public submit at **/submit**

**Production** → [docs/DEPLOY.md](docs/DEPLOY.md)

---

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `sabhisheksagar200@gmail.com` | `$uper!@#$base` |
| Engineer | `bob@gmail.com` | `TempPassp9fkj2y8!` |
| Operator | `frank@gmail.com` | `TempPassv0c76vwp!` |
| Submitter | `abhisheksagar110@gmail.com` | `TempPasskbzvup36!` |

> Link Supabase Auth users to DB: `UPDATE "User" SET "supabaseId" = '<uuid>' WHERE email = '...'` — see [docs/DEPLOY.md](docs/DEPLOY.md)

---

## KPI dashboard (`/kpi`)

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
├── app/(public)/     submit · login · track
├── app/(app)/        dashboard · kpi · admin · tickets
├── app/api/          REST · webhooks · cron
├── components/       UI + charts
├── lib/              auth · sla · linear · email · slack
├── prisma/           schema · migrations · seed
└── docs/DEPLOY.md    full setup guide
```

---

## Key decisions

| Decision | Why |
|----------|-----|
| Anonymous submit | Zero friction for non-technical users |
| Token tracking `/track/[token]` | Customers see status, not internal notes |
| Linear only after triage | Engineering controls their backlog |
| Server-side RBAC | API enforces security, not just UI |
| Operator = read-only | Call monitors see all, change nothing |

---

## What's next

| Priority | Feature |
|----------|---------|
| 🔥 High | AI severity suggestion · Recurring issue detection · Filtered CSV export |
| 📌 Medium | SMS (Twilio) · Call platform webhook · Weekly digest email |
| 🔮 Later | MCP tools for engineers · Configurable SLA UI · Password reset |

---

<p align="center">
  <sub>
    Built for AutoAce ·
    <a href="https://join.slack.com/t/autoaceticket-vts9935/shared_invite/zt-41t6ctnmr-3nFERfqFdNBnHrSzwFUQoA">Slack</a> ·
    <a href="docs/DEPLOY.md">Deploy</a>
  </sub>
</p>
