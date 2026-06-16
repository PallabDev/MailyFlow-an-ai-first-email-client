import { db } from './corsair';
import { userSubscriptions, userUsage } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface PlanLimits {
  aiLimit: number;
  gmailLimit: number;
  calendarLimit: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  Starter: { aiLimit: 10, gmailLimit: 500, calendarLimit: 500 },
  Professional: { aiLimit: 30, gmailLimit: 500, calendarLimit: 500 },
  Business: { aiLimit: 100, gmailLimit: 500, calendarLimit: 500 },
};

export async function checkRateLimit(
  userId: string,
  action: 'ai' | 'gmail' | 'calendar'
): Promise<{ allowed: boolean; current: number; limit: number; error?: string }> {
  try {
    // Wrap the operation in a transaction with write locking (FOR UPDATE) to prevent race conditions
    return await db.transaction(async (tx) => {
      // 1. Fetch user subscription details
      const [sub] = await tx
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      const planName = sub?.status === 'active' || sub?.status === 'cancelled' ? (sub?.planName || 'Starter') : 'Starter';
      const limits = { ...(PLAN_LIMITS[planName] || PLAN_LIMITS.Starter) };

      // Check if plan has expired
      if (sub?.status === 'cancelled' && sub.endDate && new Date() > new Date(sub.endDate)) {
        limits.aiLimit = PLAN_LIMITS.Starter.aiLimit;
      }

      // 2. Fetch usage statistics using FOR UPDATE locking to prevent concurrent increment races
      const todayStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
      const [usage] = await tx
        .select()
        .from(userUsage)
        .where(eq(userUsage.userId, userId))
        .for('update');

      let aiCount = usage?.aiCallsCount ?? 0;
      let gmailCount = usage?.gmailCallsCount ?? 0;
      let calendarCount = usage?.calendarCallsCount ?? 0;

      // Reset daily counts if date changed
      if (!usage || usage.lastResetDate !== todayStr) {
        aiCount = 0;
        gmailCount = 0;
        calendarCount = 0;

        if (!usage) {
          await tx.insert(userUsage).values({
            userId,
            aiCallsCount: 0,
            gmailCallsCount: 0,
            calendarCallsCount: 0,
            lastResetDate: todayStr,
          });
        } else {
          await tx
            .update(userUsage)
            .set({
              aiCallsCount: 0,
              gmailCallsCount: 0,
              calendarCallsCount: 0,
              lastResetDate: todayStr,
              updatedAt: new Date(),
            })
            .where(eq(userUsage.userId, userId));
        }
      }

      // 3. Enforce limit and increment
      if (action === 'ai') {
        if (aiCount >= limits.aiLimit) {
          return {
            allowed: false,
            current: aiCount,
            limit: limits.aiLimit,
            error: `Daily AI Operation limit reached (${limits.aiLimit}). Please upgrade your plan in Workspace Settings -> Billing.`
          };
        }
        await tx
          .update(userUsage)
          .set({
            aiCallsCount: aiCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(userUsage.userId, userId));
        return { allowed: true, current: aiCount + 1, limit: limits.aiLimit };
      } else if (action === 'gmail') {
        if (gmailCount >= limits.gmailLimit) {
          return {
            allowed: false,
            current: gmailCount,
            limit: limits.gmailLimit,
            error: `Daily Gmail refresh/action limit reached (${limits.gmailLimit}) to prevent anti-spam.`
          };
        }
        await tx
          .update(userUsage)
          .set({
            gmailCallsCount: gmailCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(userUsage.userId, userId));
        return { allowed: true, current: gmailCount + 1, limit: limits.gmailLimit };
      } else {
        if (calendarCount >= limits.calendarLimit) {
          return {
            allowed: false,
            current: calendarCount,
            limit: limits.calendarLimit,
            error: `Daily Calendar refresh/action limit reached (${limits.calendarLimit}) to prevent anti-spam.`
          };
        }
        await tx
          .update(userUsage)
          .set({
            calendarCallsCount: calendarCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(userUsage.userId, userId));
        return { allowed: true, current: calendarCount + 1, limit: limits.calendarLimit };
      }
    });
  } catch (error) {
    // Fail closed on DB error to prevent billing/cost bypasses
    console.error('Rate limit verification failed (failing closed):', error);
    return {
      allowed: false,
      current: 0,
      limit: 0,
      error: 'System rate limiting is currently experiencing connection issues. Please try again in a moment.'
    };
  }
}
