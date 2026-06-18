import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/utils/corsair';
import { emailPriorities } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const emailId = searchParams.get('emailId');
    const emailIds = searchParams.get('ids');

    if (emailId) {
      const [priority] = await db
        .select()
        .from(emailPriorities)
        .where(and(eq(emailPriorities.userId, userId), eq(emailPriorities.emailId, emailId)))
        .limit(1);

      return NextResponse.json({ priority: priority || null });
    }

    if (emailIds) {
      const ids = emailIds.split(',').filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ priorities: [] });
      }

      const priorities = await db
        .select()
        .from(emailPriorities)
        .where(
          and(
            eq(emailPriorities.userId, userId),
            inArray(emailPriorities.emailId, ids)
          )
        );

      const map = new Map(priorities.map((p) => [p.emailId, p]));
      return NextResponse.json({ priorities: Object.fromEntries(map) });
    }

    return NextResponse.json({ error: 'Provide emailId or ids query parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching email priorities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
