import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair, ensureGoogleCredentialsSynced } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ConnectedAccount, CalendarConfig, CreateEventRequest, UpdateEventRequest, DeleteEventRequest } from './_types';
import { checkRateLimit } from '@/utils/rate-limit';

async function getCalendarClient(userId: string) {
  let connectedAccounts: ConnectedAccount[] = [];
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
    (acc) => acc.name === 'googlecalendar' && (acc.config as CalendarConfig)?.access_token
  );
  if (!hasCalendarConnection) {
    return null;
  }
  return corsair.withTenant(userId);
}

export async function GET(req: NextRequest) {
  try {
    await ensureGoogleCredentialsSynced();

    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rateLimit = await checkRateLimit(userId, 'calendar');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.error }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get('timeMin') || undefined;
    const timeMax = searchParams.get('timeMax') || undefined;

    const client = await getCalendarClient(userId);
    if (!client) {
      return NextResponse.json({
        events: [],
        needsConnection: true,
      });
    }

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
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/calendar:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rateLimit = await checkRateLimit(userId, 'calendar');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.error }, { status: 429 });
    }

    const { event } = (await req.json()) as CreateEventRequest;
    if (!event) {
      return NextResponse.json({ error: 'Event details are required' }, { status: 400 });
    }

    const client = await getCalendarClient(userId);
    if (!client) {
      return NextResponse.json({ error: 'Please connect your Google Calendar on the onboarding page before managing events.' }, { status: 400 });
    }

    const result = await client.googlecalendar.api.events.create({
      calendarId: 'primary',
      event,
    });

    return NextResponse.json({ success: true, event: result });
  } catch (error: unknown) {
    console.error('Error in POST /api/calendar:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rateLimit = await checkRateLimit(userId, 'calendar');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.error }, { status: 429 });
    }

    const { id, event } = (await req.json()) as UpdateEventRequest;
    if (!id || !event) {
      return NextResponse.json({ error: 'Event ID and details are required' }, { status: 400 });
    }

    const client = await getCalendarClient(userId);
    if (!client) {
      return NextResponse.json({ error: 'Please connect your Google Calendar on the onboarding page before managing events.' }, { status: 400 });
    }

    const result = await client.googlecalendar.api.events.update({
      calendarId: 'primary',
      id,
      event,
    });

    return NextResponse.json({ success: true, event: result });
  } catch (error: unknown) {
    console.error('Error in PUT /api/calendar:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rateLimit = await checkRateLimit(userId, 'calendar');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.error }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = (await req.json()) as DeleteEventRequest;
        id = body.id || null;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const client = await getCalendarClient(userId);
    if (!client) {
      return NextResponse.json({ error: 'Please connect your Google Calendar on the onboarding page before managing events.' }, { status: 400 });
    }

    await client.googlecalendar.api.events.delete({
      calendarId: 'primary',
      id,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/calendar:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

