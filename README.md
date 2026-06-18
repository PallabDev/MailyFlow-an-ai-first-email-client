# MailyFlow

**AI-First Email & Calendar Workspace** -- A multi-tenant, production-grade email assistant built on Gmail, Google Calendar, and OpenAI. Real-time webhooks, AI-powered email prioritization, background workflows, and a full billing system.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Custom Node.js Server                        │
│                     (Next.js + Socket.IO on :3000)                   │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│  Clerk   │  Corsair │  Inngest │ OpenAI   │ Razorpay │   Resend     │
│  Auth    │  Gmail/  │  BG      │ GPT      │ Payments │  Emails      │
│          │  Cal SDK │  Jobs    │          │          │              │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────────┤
│                         PostgreSQL (Drizzle ORM)                     │
│   corsair_integrations | corsair_accounts | corsair_entities        │
│   corsair_events | chat_messages | user_subscriptions                │
│   user_usage | email_priorities | health_logs                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Real-time Pipeline

```
Gmail Pub/Sub Push
  → /api/corsair (webhook receiver)
    → Inngest syncGmailWebhook (processes via Corsair SDK)
      → pg_notify('new_email') (Postgres LISTEN/NOTIFY)
        → EventEmitter (in-process bridge)
          → Socket.IO (broadcasts to user:{userId} room)
            → Client useEmailSocket hook (dispatches CustomEvents)
```

---

## Features

### Email
- **Gmail Integration** -- Full read/send/trash/star/draft via Gmail API through Corsair SDK
- **DB Cache Layer** -- All emails cached in `corsair_entities` table. API routes hit DB first, fall back to Gmail API on miss. Reduces N+1 API calls
- **429 Rate Limit Cooldown** -- Automatic 20-minute cooldown on Gmail API rate limits, stored in DB
- **Folder Views** -- Inbox, Starred, Drafts, Sent, Spam, Trash, Promotions (Gmail `CATEGORY_PROMOTIONS`)
- **Compose** -- Rich compose modal with attachment support (base64 encoding, file type detection)
- **Advanced Search** -- Filter by sender, recipient, subject, date range, attachment status, priority level
- **Email Priority** -- AI-powered priority classification (1-5 scale) with categories (urgent, work, personal, promotional, spam). Auto-triggered on new emails for paid plans
- **Priority Sorting** -- Sort email lists by date or AI-computed priority
- **Keyboard Shortcuts** -- `Ctrl+K` (search), `C` (compose), `Ctrl+Alt+M` (promotions), `R` (reply), `S` (star), `Delete` (trash)

### AI Assistant
- **Multi-Tool Agent** -- OpenAI Agent with Corsair MCP tools: Gmail search, send, draft, label management; Calendar create/update/delete events
- **Persistent Context** -- Last 20 messages loaded from DB on sidebar open. Full chat history in separate view
- **Early-Halt Cancellation** -- Cancel pending AI requests instantly to save token quotas
- **Plan-Gated Responses** -- Paid users get verbose, professional responses. Free users get minimal responses
- **AI Email Summarization** -- Paid feature. Generates concise summaries via background Inngest job. Result broadcast via Socket.IO
- **AI Reply Drafting** -- Paid feature. Generates contextual reply drafts via background job. Result broadcast via Socket.IO
- **Real-time Streaming** -- AI responses stream to UI via Socket.IO events (`email-summary-ready`, `email-draft-ready`)

### Calendar
- **Google Calendar CRUD** -- Full create/read/update/delete events via Corsair SDK
- **Event Modal** -- Create and edit events with title, date/time, description
- **Watch Subscriptions** -- Auto-registered on OAuth, auto-renewed if expiring in <2 days
- **Daily Limits** -- Rate-limited per plan tier

### Billing
- **Three Tiers** -- Starter (Free), Professional (INR 999/mo), Business (INR 1999/mo)
- **Razorpay Checkout** -- Full payment flow: order creation → Razorpay checkout → signature verification → DB update
- **Payment Verification** -- HMAC-SHA256 signature validation + Razorpay API order verification to prevent replay attacks
- **Subscription Management** -- 30-day billing cycles. Cancel retains features until cycle end
- **Confirmation Emails** -- Sent via Resend on successful payment
- **Daily Usage Tracking** -- Per-user counters for AI calls, Gmail calls, Calendar calls, summaries, replies. Resets daily

### Real-time
- **Socket.IO** -- Authenticated via Clerk JWT. Users join `user:{userId}` rooms. Auto-reconnects
- **Postgres LISTEN/NOTIFY** -- Cross-instance event propagation for new emails
- **Webhook Deduplication** -- 10-second dedup window per `tenantId:emailId` key
- **In-app Notifications** -- Bell icon with notification dropdown, mark read/unread

### Dashboard
- **Collapsible Sidebar** -- Left sidebar with navigation, user profile, connection status
- **Theme Toggle** -- Dark/light mode with localStorage persistence
- **Notification Center** -- Real-time notification feed with email preview

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Runtime | Custom Node.js server (Next.js + Socket.IO) |
| Language | TypeScript 5 |
| Auth | Clerk |
| Database | PostgreSQL + Drizzle ORM |
| Email/Calendar SDK | Corsair (`@corsair-dev/gmail`, `@corsair-dev/googlecalendar`) |
| AI | OpenAI GPT (via `api.aicredits.in/v1`) |
| Background Jobs | Inngest |
| Payments | Razorpay |
| Realtime | Socket.IO + Postgres LISTEN/NOTIFY |
| Email Delivery | Resend |
| State Management | Zustand |
| Styling | TailwindCSS 4 |
| Logging | Winston |
| Validation | Zod |
| Linting | ESLint 9 + `eslint-config-next` |
| Hooks | lint-staged (pre-commit), raw git hooks (pre-push) |

---

## Project Structure

```
src/
  app/
    api/
      auth/
        connect/route.ts        # Google OAuth initiation
        callback/route.ts       # OAuth callback + watch registration
      emails/
        route.ts                # Email list (DB cache-first)
        detail/route.ts         # Single email detail
        summarize/route.ts      # AI summary trigger
        draft-reply/route.ts    # AI reply draft trigger
        priority/route.ts       # AI priority lookup
      send-email/route.ts       # Send email via Gmail
      trash-email/route.ts      # Trash/delete email
      star-email/route.ts       # Toggle star
      save-draft/route.ts       # Save draft
      labels/route.ts           # Label counts + connection status
      chat/route.ts             # AI chat (GET/POST/PUT)
      calendar/route.ts         # Calendar CRUD
      billing/
        create-order/route.ts   # Razorpay order creation
        verify-payment/route.ts # Payment verification + DB update
        cancel/route.ts         # Cancel subscription
        status/route.ts         # Subscription + usage status
      corsair/[[...corsair]]/route.ts  # Gmail Pub/Sub webhook
      inngest/route.ts          # Inngest serve endpoint
      health/route.ts           # Health check + DB ping
    dashboard/
      inbox/page.tsx            # Inbox folder
      starred/page.tsx          # Starred folder
      draft/page.tsx            # Drafts folder
      sent/page.tsx             # Sent folder
      spam/page.tsx             # Spam folder
      trash/page.tsx            # Trash folder
      promotions/page.tsx       # Promotions folder
      calendar/page.tsx         # Calendar view
      billing/page.tsx          # Billing dashboard
      integrations/page.tsx     # Connection management
  features/
    ai/
      components/               # AIAssistant, AISvg
      services/ai_system.ts     # Dynamic system prompt builder
      store/chatStore.ts        # Zustand chat state
    billing/components/         # BillingPage
    calendar/components/        # CalendarClient, EventModal
    dashboard/components/       # Sidebar, Header, ClientLayoutWrapper
    email/
      components/               # FolderPageClient, EmailDetail, ComposeModal, AdvancedSearchPanel
      hooks/useEmailSocket.ts   # Socket.IO realtime hook
      services/fetch-emails.ts  # Email fetching service
      types/email-api.ts        # TypeScript interfaces
  lib/
    corsair/
      index.ts                  # Pool, DB, Corsair instance, PG listener, credential sync
      utils.ts                  # hasActiveConnection, renewWatches, stopWatches
    openai/client.ts            # OpenAI client + model config
    socket/server.ts            # Socket.IO server + event bridge
    cooldown.ts                 # Gmail 429 cooldown manager
    rate-limit.ts               # Daily rate limiter (transaction-based)
    emitter.ts                  # Global EventEmitter singleton
    publish-new-email.ts        # pg_notify publisher
    email-helper.ts             # Email rendering + sanitization
    logger.ts                   # Winston logger
    validation.ts               # Zod env + message schemas
  server/
    db/
      schema.ts                 # Drizzle schema (all tables)
      clear.ts                  # DB reset script
      drizzle.config.ts         # Drizzle Kit config
    inngest/
      client.ts                 # Inngest client
      functions.ts              # All background functions
  stores/
    composeStore.ts             # Compose modal state
    notificationStore.ts        # Notification state
  config/
    app.ts                      # APP_CONFIG
    ai.ts                       # AI_CONFIG (model, baseURL)
  constants/
    plans.ts                    # PLAN_LIMITS per tier
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `corsair_integrations` | OAuth integration configs (gmail, googlecalendar) with DEK |
| `corsair_accounts` | Per-tenant OAuth tokens (access_token, refresh_token encrypted) |
| `corsair_entities` | Cached Gmail data (messages, labels) + cooldown records |
| `corsair_events` | Webhook event log |
| `chat_messages` | AI chat messages (user/assistant, status: pending/completed/failed/cancelled) |
| `user_subscriptions` | Razorpay subscription records (plan, status, payment IDs, billing cycle) |
| `user_usage` | Daily rate limit counters (AI, Gmail, Calendar, Summary, Reply calls) |
| `email_priorities` | AI-computed email priorities (1-5 scale + category + reason) |
| `health_logs` | Health check audit log |

---

## Inngest Background Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `process-ai-call` | `chat.message.sent` | Runs OpenAI Agent with MCP tools. Loads context from DB. Streams progress. Retries: 2 |
| `sync-gmail-webhook` | `gmail.webhook.received` | Processes Gmail push notifications. Publishes real-time events. Triggers priority classification. Concurrency: 1/tenant |
| `summarize-email` | `email.summarize.requested` | Generates AI summary. Broadcasts via Socket.IO |
| `draft-email-reply` | `email.draft.requested` | Generates AI reply draft. Broadcasts via Socket.IO |
| `classify-email-priority` | `email.classify.requested` | Classifies email priority (paid only). Saves to `email_priorities` |
| `track-failed-ai-calls` | `inngest/function.failed` | Marks failed assistant messages in DB |

---

## Pricing

| Plan | Price | AI Calls/day | Summaries/day | Replies/day |
|------|-------|-------------|---------------|-------------|
| **Starter** | Free | 10 | 0 | 0 |
| **Professional** | INR 999/mo | 50 | 20 | 20 |
| **Business** | INR 1999/mo | 150 | 40 | 40 |

All plans include: Gmail integration (500 API calls/day), Calendar integration (500 API calls/day).

**Paid-only features:** AI email summarization, AI reply drafting, AI priority classification, advanced search filters, verbose AI responses.

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google Cloud project with Gmail API, Calendar API, and Pub/Sub enabled
- Clerk account (authentication)
- OpenAI API key (or compatible endpoint)
- Razorpay account (payments)
- Inngest account (background jobs)
- Resend API key (confirmation emails, optional)

### 1. Clone and install

```bash
git clone https://github.com/PallabDev/MailyFlow-an-ai-first-email-client.git
cd MailyFlow-an-ai-first-email-client
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# ─── Authentication (Clerk) ────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# ─── Database ──────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/mailyflow

# ─── Google OAuth ──────────────────────────────────────────────
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
TOPIC_ID=projects/your-gcp-project/topics/your-topic

# ─── AI ────────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_AI_MODEL=gpt-5-mini

# ─── Payments (Razorpay) ──────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# ─── Background Jobs (Inngest) ─────────────────────────────────
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-...

# ─── Email Delivery (Resend, optional) ─────────────────────────
RESEND_API_KEY=re_...
RESEND_FROM=MailyFlow <no-reply@yourdomain.com>

# ─── Corsair SDK ───────────────────────────────────────────────
CORSAIR_KEK=<64-char-hex-string>

# ─── App Config ────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
ProjectName=MailyFlow
```

### 3. Database Setup

```bash
# Push schema to PostgreSQL
npm run db:push

# Optional: Open Drizzle Studio to inspect data
npm run db:studio
```

### 4. Google Cloud Setup

1. Enable **Gmail API**, **Google Calendar API**, and **Cloud Pub/Sub API** in your GCP project
2. Create OAuth 2.0 credentials (Web application type)
3. Add authorized redirect URI: `{YOUR_URL}/api/auth/callback`
4. Create a Pub/Sub topic and subscription for Gmail push notifications
5. Set the topic ID in `TOPIC_ID` env var

### 5. Run

```bash
# Development (with hot reload via tsx watch)
npm run dev

# Production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Inngest Dev Server

For local development, run the Inngest dev server to process background jobs:

```bash
npx inngest dev
```

This provides a dashboard at `http://localhost:8288` to inspect function runs.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run typecheck` | TypeScript type check |
| `npm run check` | Lint + typecheck |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:clear` | Clear all database tables |

---

## Git Hooks

- **Pre-commit** (lint-staged): Runs `eslint --fix --max-warnings=0` + `tsc --noEmit` on staged files
- **Pre-push**: Runs full `eslint src` + `tsc --noEmit` before allowing push

---

## Security

- **Multi-tenant isolation** -- All API routes enforce Clerk `userId` matching. No cross-tenant data access
- **Payment verification** -- Razorpay HMAC-SHA256 signature validation + API-level order verification
- **SMTP header injection prevention** -- Sanitizes `\r` and `\n` in email fields
- **Stored XSS protection** -- DOMParser-based HTML sanitizer strips `<script>`, `<iframe>`, `javascript:` URLs, inline handlers from email bodies
- **Rate limiting** -- Transaction-based `SELECT FOR UPDATE` atomic rate checks. Fails closed on DB errors
- **Environment validation** -- Zod schema checks on startup in `instrumentation.ts`
- **CORS** -- Strict origin checks in Socket.IO and postMessage handlers

---

## License

Private -- All rights reserved.
