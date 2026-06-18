# Production Writing Rules

## Code Style & Conventions

### File Naming
- **Components**: PascalCase (`EmailList.tsx`, `AIAssistant.tsx`)
- **Hooks**: camelCase with `use` prefix (`useEmailSocket.ts`)
- **Services**: kebab-case (`fetch-emails.ts`, `send-email.ts`)
- **Types**: kebab-case with `.types.ts` suffix or colocated (`email-api.ts`)
- **Constants**: kebab-case (`plans.ts`, `limits.ts`)
- **Config**: kebab-case (`app.ts`, `ai.ts`)

### Import Order
```ts
// 1. React/Next.js
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { motion } from 'motion/react';

// 3. Feature imports (absolute)
import { useChatStore } from '@/features/ai/store/chatStore';
import { useEmailSocket } from '@/features/email/hooks/useEmailSocket';

// 4. Shared imports (absolute)
import { Button } from '@/components/ui/Button';
import { useNotificationStore } from '@/stores/notificationStore';

// 5. Lib imports (absolute)
import { openai } from '@/lib/openai/client';
import { formatEmailDate } from '@/lib/email-helper';

// 6. Config/Constants (absolute)
import { APP_CONFIG } from '@/config/app';
import { PLAN_LIMITS } from '@/constants/plans';

// 7. Relative imports
import { EmailItem } from './types';
```

### Component Rules
- Use `'use client'` directive only when needed (useState, useEffect, event handlers)
- Prefer server components by default
- Keep components under 200 lines — extract hooks, utils, or sub-components
- Never put business logic in components — use services/hooks
- Never put database calls in components — use server actions

### Hook Rules
- One hook per file
- Name must start with `use`
- Return typed objects, not arrays (unless tuple is needed)
- Use ` useCallback` for functions passed as props
- Use ` useMemo` for expensive computations

### Service Rules
- Services contain business logic only
- Services call repositories/lib for data access
- Services never import from `components/`
- Services never import from `app/`
- One service function per file

### Type Rules
- Prefer interfaces over types for object shapes
- Use `readonly` for immutable data
- Export types from feature `types/` directory
- Never use `any` — use `unknown` or proper types

### Error Handling
- Always handle errors in services/actions
- Use typed error responses
- Log errors with context (service name, action, userId)
- Never expose internal errors to clients

### Testing Rules
- Test services in isolation (mock repositories)
- Test hooks with `@testing-library/react-hooks`
- Test components with `@testing-library/react`
- Use MSW for API mocking
- Minimum 80% coverage for services

## Directory Structure Enforcement

### Allowed Imports
```
features/* → services/* → repositories/* → database
features/* → lib/* → external providers
components/* → lib/* → external providers
app/* → features/* (via barrel exports only)
```

### Forbidden Imports
```
components/* → database (direct)
app/* → database (direct)
components/* → external SDKs (direct)
pages/* → services (direct)
```

### Feature Isolation
- Each feature must be self-contained
- Cross-feature imports go through barrel `index.ts`
- Shared code goes in `components/ui/`, `lib/`, `hooks/`, `stores/`
- Never import from another feature's internal files

## Git Rules

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`
- Max 72 characters
- Reference issue numbers when applicable

### Pre-push Checks
- ESLint must pass with 0 errors
- TypeScript must compile with 0 errors
- No `console.log` in production code (use logger)

### Branch Naming
- `feat/feature-name`
- `fix/bug-description`
- `refactor/component-name`
- `chore/task-description`

## Performance Rules

### Component Optimization
- Use `React.memo` for expensive renders
- Use `useMemo` for computed values
- Use `useCallback` for event handlers passed to children
- Lazy load heavy components with `dynamic()`

### Data Fetching
- Use SWR/React Query for client-side data
- Prefer server components for initial data
- Cache API responses appropriately
- Implement optimistic updates for mutations

### Bundle Size
- Tree-shake imports: `import { format } from 'date-fns'` not `import * as dfns`
- Dynamic import for modals and heavy components
- Analyze bundle with `@next/bundle-analyzer`

## Security Rules

### Environment Variables
- Never commit `.env` files
- Use `NEXT_PUBLIC_` prefix only for client-safe values
- Validate env vars on startup with Zod

### Data Validation
- Validate all API inputs with Zod schemas
- Sanitize user inputs before database queries
- Use parameterized queries (never string concatenation)

### Authentication
- Always check `auth()` in server components and API routes
- Use Clerk middleware for protected routes
- Never trust client-side auth state alone
