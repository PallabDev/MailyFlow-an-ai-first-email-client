import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/corsair';
import { userSubscriptions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { inngest } from '@/server/inngest/client';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { emailId } = await req.json();
    if (!emailId) {
      return NextResponse.json({ error: 'Missing emailId' }, { status: 400 });
    }

    // 1. Verify user plan
    const [sub] = await db
      .select({ planName: userSubscriptions.planName, status: userSubscriptions.status })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);

    const planName = sub?.status === 'active' || sub?.status === 'cancelled' ? (sub?.planName || 'Starter') : 'Starter';
    if (planName === 'Starter') {
      return NextResponse.json({ error: 'Upgrade required. Summarization is a paid feature.' }, { status: 403 });
    }

    // 2. Trigger Inngest workflow
    await inngest.send({
      name: 'email.summarize.requested',
      data: {
        userId,
        emailId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error triggering summary workflow:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
