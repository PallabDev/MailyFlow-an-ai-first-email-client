import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/utils/corsair';
import { userSubscriptions, userUsage } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PLAN_LIMITS } from '@/utils/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Fetch user subscription details
    const [sub] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    const planName = sub?.status === 'active' || sub?.status === 'cancelled' ? (sub?.planName || 'Starter') : 'Starter';
    const subStatus = sub?.status || 'inactive';
    const price = sub?.price || 'Free';
    const startDate = sub?.startDate || null;
    const endDate = sub?.endDate || null;

    // Check if cancelled plan has expired
    let expired = false;
    if (subStatus === 'cancelled' && endDate && new Date() > new Date(endDate)) {
      expired = true;
    }

    const activePlan = expired ? 'Starter' : planName;
    const activeStatus = expired ? 'expired' : subStatus;
    const activeLimits = PLAN_LIMITS[activePlan];

    // 2. Fetch daily usage statistics
    const todayStr = new Date().toISOString().slice(0, 10);
    const [usage] = await db
      .select()
      .from(userUsage)
      .where(eq(userUsage.userId, userId));

    let aiCount = usage?.aiCallsCount ?? 0;
    let gmailCount = usage?.gmailCallsCount ?? 0;
    let calendarCount = usage?.calendarCallsCount ?? 0;

    // Reset daily counters logically on read if date has changed (idempotent, actual write happens on next rate limit check)
    if (usage && usage.lastResetDate !== todayStr) {
      aiCount = 0;
      gmailCount = 0;
      calendarCount = 0;
    }

    return NextResponse.json({
      success: true,
      subscription: {
        planName: activePlan,
        status: activeStatus,
        price,
        startDate,
        endDate,
      },
      usage: {
        ai: aiCount,
        gmail: gmailCount,
        calendar: calendarCount,
        limits: activeLimits,
      },
    });
  } catch (error) {
    console.error('Error fetching billing status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
