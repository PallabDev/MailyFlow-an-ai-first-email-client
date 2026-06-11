export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import CalendarClient from './CalendarClient';

export default async function CalendarPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

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
    console.error('Error querying connected accounts:', error);
  }

  const hasCalendar = connectedAccounts.some(
    acc => acc.name === 'googlecalendar' && (acc.config as any)?.access_token
  );
  const calendarTenantId = hasCalendar ? userId : 'dev';

  let events: any[] = [];
  let calendarError: string | null = null;

  try {
    const client = corsair.withTenant(calendarTenantId);
    // Fetch initial events for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await client.googlecalendar.api.events.getMany({
      calendarId: 'primary',
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: startOfMonth.toISOString(),
      timeMax: endOfMonth.toISOString(),
    });
    events = result.items ?? [];
  } catch (error: any) {
    console.error('Error listing calendar events:', error);
    calendarError = error.message || 'Failed to fetch Google Calendar events.';
  }

  return (
    <CalendarClient
      initialEvents={events}
      calendarError={calendarError}
    />
  );
}
