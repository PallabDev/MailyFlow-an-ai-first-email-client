import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get('timeMin') || undefined;
    const timeMax = searchParams.get('timeMax') || undefined;

    // Check if user has connected Google Calendar
    let connectedAccounts: any[] = [];
    try {
      connectedAccounts = await db
        .select({
          name: corsairIntegrations.name,
          config: corsairAccounts.config,
        })
        .from(corsairAccounts)
        .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
        .where(eq(corsairAccounts.tenantId, userId));
    } catch (error) {
      console.error('Error querying connected accounts from DB:', error);
    }

    const hasCalendarConnection = connectedAccounts.some(
      (acc) => acc.name === 'googlecalendar' && (acc.config as any)?.access_token
    );
    const calendarTenantId = hasCalendarConnection ? userId : 'dev';

    const client = corsair.withTenant(calendarTenantId);

    const result = await client.googlecalendar.api.events.getMany({
      calendarId: 'primary',
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin,
      timeMax,
    });

    return NextResponse.json({
      events: result.items ?? [],
      calendarTenantId,
    });
  } catch (error: any) {
    console.error('Error in /api/calendar:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
