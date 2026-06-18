import { db } from './corsair';
import { userSubscriptions, userUsage } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface PlanLimits {
  aiLimit: number;
  gmailLimit: number;
  calendarLimit: number;
  summaryLimit: number;
  replyLimit: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  Starter: { aiLimit: 10, gmailLimit: 500, calendarLimit: 500, summaryLimit: 0, replyLimit: 0 },
  Professional: { aiLimit: 50, gmailLimit: 500, calendarLimit: 500, summaryLimit: 20, replyLimit: 20 },
  Business: { aiLimit: 150, gmailLimit: 500, calendarLimit: 500, summaryLimit: 40, replyLimit: 40 },
};

export async function checkRateLimit(
  userId: string,
  action: 'ai' | 'gmail' | 'calendar' | 'summary' | 'reply'
): Promise<{ allowed: boolean; current: number; limit: number; error?: string }> {
  try {
    return await db.transaction(async (tx) => {
      const [sub] = await tx
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      const planName = sub?.status === 'active' || sub?.status === 'cancelled' ? (sub?.planName || 'Starter') : 'Starter';
      const limits = { ...(PLAN_LIMITS[planName] || PLAN_LIMITS.Starter) };

      if (sub?.status === 'cancelled' && sub.endDate && new Date() > new Date(sub.endDate)) {
        limits.aiLimit = PLAN_LIMITS.Starter.aiLimit;
        limits.summaryLimit = PLAN_LIMITS.Starter.summaryLimit;
        limits.replyLimit = PLAN_LIMITS.Starter.replyLimit;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const [usage] = await tx
        .select()
        .from(userUsage)
        .where(eq(userUsage.userId, userId))
        .for('update');

      let aiCount = usage?.aiCallsCount ?? 0;
      let gmailCount = usage?.gmailCallsCount ?? 0;
      let calendarCount = usage?.calendarCallsCount ?? 0;
      let summaryCount = usage?.summaryCallsCount ?? 0;
      let replyCount = usage?.replyCallsCount ?? 0;

      if (!usage || usage.lastResetDate !== todayStr) {
        aiCount = 0;
        gmailCount = 0;
        calendarCount = 0;
        summaryCount = 0;
        replyCount = 0;

        if (!usage) {
          await tx.insert(userUsage).values({
            userId,
            aiCallsCount: 0,
            gmailCallsCount: 0,
            calendarCallsCount: 0,
            summaryCallsCount: 0,
            replyCallsCount: 0,
            lastResetDate: todayStr,
          });
        } else {
          await tx
            .update(userUsage)
            .set({
              aiCallsCount: 0,
              gmailCallsCount: 0,
              calendarCallsCount: 0,
              summaryCallsCount: 0,
              replyCallsCount: 0,
              lastResetDate: todayStr,
              updatedAt: new Date(),
            })
            .where(eq(userUsage.userId, userId));
        }
      }

      if (action === 'ai') {
        if (aiCount >= limits.aiLimit) {
          return {
            allowed: false,
            current: aiCount,
            limit: limits.aiLimit,
            error: `Daily AI Operation limit reached (${limits.aiLimit}). Please upgrade your plan in Workspace Settings -> Billing.`
          };
        }
        await tx.update(userUsage).set({ aiCallsCount: aiCount + 1, updatedAt: new Date() }).where(eq(userUsage.userId, userId));
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
        await tx.update(userUsage).set({ gmailCallsCount: gmailCount + 1, updatedAt: new Date() }).where(eq(userUsage.userId, userId));
        return { allowed: true, current: gmailCount + 1, limit: limits.gmailLimit };
      } else if (action === 'summary') {
        if (summaryCount >= limits.summaryLimit) {
          return {
            allowed: false,
            current: summaryCount,
            limit: limits.summaryLimit,
            error: `Daily AI Summary limit reached (${limits.summaryLimit}). Please upgrade your plan in Workspace Settings -> Billing.`
          };
        }
        await tx.update(userUsage).set({ summaryCallsCount: summaryCount + 1, updatedAt: new Date() }).where(eq(userUsage.userId, userId));
        return { allowed: true, current: summaryCount + 1, limit: limits.summaryLimit };
      } else if (action === 'reply') {
        if (replyCount >= limits.replyLimit) {
          return {
            allowed: false,
            current: replyCount,
            limit: limits.replyLimit,
            error: `Daily AI Reply limit reached (${limits.replyLimit}). Please upgrade your plan in Workspace Settings -> Billing.`
          };
        }
        await tx.update(userUsage).set({ replyCallsCount: replyCount + 1, updatedAt: new Date() }).where(eq(userUsage.userId, userId));
        return { allowed: true, current: replyCount + 1, limit: limits.replyLimit };
      } else {
        if (calendarCount >= limits.calendarLimit) {
          return {
            allowed: false,
            current: calendarCount,
            limit: limits.calendarLimit,
            error: `Daily Calendar refresh/action limit reached (${limits.calendarLimit}) to prevent anti-spam.`
          };
        }
        await tx.update(userUsage).set({ calendarCallsCount: calendarCount + 1, updatedAt: new Date() }).where(eq(userUsage.userId, userId));
        return { allowed: true, current: calendarCount + 1, limit: limits.calendarLimit };
      }
    });
  } catch (error) {
    console.error('Rate limit verification failed (failing closed):', error);
    return {
      allowed: false,
      current: 0,
      limit: 0,
      error: 'System rate limiting is currently experiencing connection issues. Please try again in a moment.'
    };
  }
}
