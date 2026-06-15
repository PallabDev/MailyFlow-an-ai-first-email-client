# MailyFlow ✉️🤖 — An AI-First Email & Calendar Workspace

MailyFlow is a premium, multi-tenant AI email assistant and workspace integrated directly with Gmail and Google Calendar. It is built to optimize daily email routines, streamline calendar scheduling, and provide secure, contextual AI assistance directly from the sidebar.

---

## 🌟 Key Features

### 1. Unified Google Workspace Integration
- **One-Click Authorization**: Concurrently connect both Gmail and Google Calendar through a single Google consent screen.
- **Synchronized Disconnections**: Revoking Google Workspace authorization disconnects both services together for a clean security state.

### 2. Multi-Tenant AI Copilot
- **Corsair MCP Tools Integration**: Fully automated tool execution for search, drafts, message sending, and event creation via the `@corsair-dev` packages.
- **Persistent AI Assistant Context**: Restores active conversation history on sidebar load without client-side message leaks.
- **Early-Halt Cancellation**: Cancelling a pending AI request stops the LLM run instantly to save OpenAI token quotas and prevent execution races.

### 3. High Performance & Realtime Feeds
- **Deduplicated Realtime Webhooks**: Uses Gmail Pub/Sub and Google Calendar watch subscriptions with per-tenant event deduplication.
- **SSE Stream Scoping**: Authenticated Server-Sent Events (SSE) stream scoped strictly to the logged-in Clerk user.
- **Intelligent Local Cache**: Reduces Gmail N+1 API calls by loading emails from local database cache first, only fetching fresh data on manual pings or webhook updates.

---

## 🔒 Security Audit & Hardening

This project has been fully audited and secured against major security vulnerabilities:
1. **Multi-Tenant Isolation**: Removed all `'dev'` fallback logic in authenticated API routes to prevent cross-tenant cache reads/writes.
2. **SSE Authorization**: Restricts SSE connections to authenticated Clerk users and filters incoming events server-side by `tenantId`.
3. **IDOR Prevention**: Hardened chat cancellation routes by matching updates against both the `messageId` and `userId`.
4. **Payment Gateway Verification**: Validates Razorpay signatures and fetches orders directly from the Razorpay API to verify amount matching, user ownership, and prevent payment replay attacks.
5. **SMTP Header Injection Prevention**: Sanitizes `to` and `subject` fields to reject carriage returns (`\r`) and line breaks (`\n`).
6. **Stored XSS Protection**: Uses a DOMParser-based HTML sanitizer to filter out `<script>`, `<iframe>`, javascript: URLs, and inline event handlers from email bodies.
7. **Wildcard Origin Prevention**: Resolves `parentOrigin` dynamically at render time and enforces strict origin/source checks in postMessage handlers.
8. **Rate Limiting Hardening**: Performs limit checks and usage increments within transaction blocks using PostgreSQL `SELECT FOR UPDATE` write-locks, failing closed on database failures.
9. **Environment Validation**: Runs Zod checks on startup inside `instrumentation.ts` to fail fast on invalid server environments.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Authentication**: [Clerk](https://clerk.com/)
- **ORM & Database**: [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL
- **Integrations client**: [Corsair](https://corsair.dev/) with `@corsair-dev/gmail`, `@corsair-dev/googlecalendar`, and `@corsair-dev/mcp`
- **Background Workflows**: [Inngest](https://www.inngest.com/)
- **AI Engine**: [OpenAI GPT-4o](https://openai.com/)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Styling**: Vanilla CSS & TailwindCSS

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+
- PostgreSQL Database
- Inngest Dev Server running locally

### 2. Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
# Next.js / Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/mailyflow

# Corsair Configuration
CORSAIR_KEK=your_32_byte_hex_kek_for_encryption

# Google OAuth credentials (configured via Google Console API)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TOPIC_ID=projects/your-gcp-project/topics/your-gmail-pubsub-topic

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Razorpay credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Project Details
ProjectName=MailyFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Push database schema to PostgreSQL
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the MailyFlow dashboard onboarding flow!



