import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/corsair';
import { userSubscriptions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { inngest } from '@/server/inngest/client';

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }
        const userId = user.id;

        const { emailId, timezone, localTime } = await req.json();
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
            return NextResponse.json({ error: 'Upgrade required. AI reply drafting is a paid feature.' }, { status: 403 });
        }

        // 2. Trigger Inngest workflow
        await inngest.send({
            name: 'email.draft.requested',
            data: {
                userId,
                emailId,
                userFirstName: user.firstName,
                userLastName: user.lastName,
                userEmail: user.emailAddresses[0]?.emailAddress || '',
                timezone: timezone || '',
                localTime: localTime || '',
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error triggering AI reply draft workflow:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
