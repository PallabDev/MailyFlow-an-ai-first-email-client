import type { PlanLimits } from '@/lib/rate-limit';

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  Starter: { aiLimit: 10, gmailLimit: 500, calendarLimit: 500, summaryLimit: 0, replyLimit: 0 },
  Professional: { aiLimit: 50, gmailLimit: 500, calendarLimit: 500, summaryLimit: 20, replyLimit: 20 },
  Business: { aiLimit: 150, gmailLimit: 500, calendarLimit: 500, summaryLimit: 40, replyLimit: 40 },
} as const;

export type PlanName = 'Starter' | 'Professional' | 'Business';
