import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import DashboardClient from '../DashboardClient';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const resolvedParams = await params;
  const rawTab = resolvedParams.tab;

  // Validate the tab parameter
  const validTabs = ['inbox', 'draft', 'drafts', 'sent', 'spam', 'trash', 'calendar'];
  if (!validTabs.includes(rawTab)) {
    redirect('/dashboard/inbox');
  }

  // Normalize tab for DashboardClient prop
  const activeTabProp = (rawTab === 'draft' || rawTab === 'drafts') ? 'drafts' : rawTab as any;

  // Query database to see what's connected for this user
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

  // Determine separate tenant IDs for Gmail and Google Calendar
  const hasGmailConnection = connectedAccounts.some(
    acc => acc.name === 'gmail' && (acc.config as any)?.access_token
  );
  const hasCalendarConnection = connectedAccounts.some(
    acc => acc.name === 'googlecalendar' && (acc.config as any)?.access_token
  );

  const gmailTenantId = hasGmailConnection ? userId : 'dev';
  const calendarTenantId = hasCalendarConnection ? userId : 'dev';

  // 1. Fetch Emails from Corsair Gmail Plugin based on active folder
  let emails: any[] = [];
  let initialNextPageToken: string | null = null;
  let emailError: string | null = null;

  // Fetch emails only if we're not on the calendar tab
  if (activeTabProp !== 'calendar') {
    const labelIdsMap: Record<string, string[]> = {
      inbox: ['INBOX'],
      drafts: ['DRAFT'],
      sent: ['SENT'],
      spam: ['SPAM'],
      trash: ['TRASH'],
    };
    const labelIds = labelIdsMap[activeTabProp] || ['INBOX'];

    try {
      const client = corsair.withTenant(gmailTenantId);
      const result = await client.gmail.api.messages.list({
        maxResults: 50,
        labelIds,
      });
      const messages = result.messages;
      initialNextPageToken = result.nextPageToken || null;

      if (messages && messages.length > 0) {
        emails = await Promise.all(
          messages.map(async (msg: any) => {
            try {
              const full = await client.gmail.api.messages.get({
                id: msg.id!,
                format: 'full',
              });

              const headers = full.payload?.headers ?? [];
              const subject = headers.find((h: any) => h.name === 'Subject')?.value ?? '(no subject)';
              const from = headers.find((h: any) => h.name === 'From')?.value ?? '(unknown)';
              const date = headers.find((h: any) => h.name === 'Date')?.value ?? '';

              let body = '(no body)';
              if (full.payload?.body?.data) {
                body = Buffer.from(full.payload.body.data, 'base64').toString('utf-8');
              } else if (full.payload?.parts) {
                const getBody = (parts: any[]): string => {
                  for (const part of parts) {
                    if (part.mimeType === 'text/html' && part.body?.data) {
                      return Buffer.from(part.body.data, 'base64').toString('utf-8');
                    }
                    if (part.parts) {
                      const subBody = getBody(part.parts);
                      if (subBody) return subBody;
                    }
                  }
                  for (const part of parts) {
                    if (part.mimeType === 'text/plain' && part.body?.data) {
                      return Buffer.from(part.body.data, 'base64').toString('utf-8');
                    }
                  }
                  return '';
                };
                body = getBody(full.payload.parts) || full.snippet || '(no body)';
              } else {
                body = full.snippet ?? '(no body)';
              }

              return {
                id: msg.id,
                from,
                date,
                subject,
                snippet: full.snippet ?? '',
                body,
                labelIds: full.labelIds ?? [],
              };
            } catch (e: any) {
              console.error(`Error fetching email details for message ID ${msg.id}:`, e);
              return {
                id: msg.id,
                from: '(unknown)',
                date: '',
                subject: '(failed to load email content)',
                snippet: '',
                body: e.message || 'Error details parsing email',
              };
            }
          })
        );
      }
    } catch (error: any) {
      console.error('Error listing emails from Corsair:', error);
      emailError = error.message || 'Failed to list Gmail messages.';
    }
  }

  // 2. Fetch Initial Calendar Events from Corsair Google Calendar Plugin
  let events: any[] = [];
  let calendarError: string | null = null;

  if (activeTabProp === 'calendar') {
    try {
      const client = corsair.withTenant(calendarTenantId);
      // Fetch events for current month (wide default query range)
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
      console.error('Error listing calendar events from Corsair:', error);
      calendarError = error.message || 'Failed to fetch Google Calendar events.';
    }
  }

  // Transform User Object to pass to client
  const serializedUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress || '',
    imageUrl: user.imageUrl,
  };

  return (
    <DashboardClient
      user={serializedUser}
      activeTenantId={userId}
      isDevFallback={!hasGmailConnection && !hasCalendarConnection}
      emails={emails}
      initialNextPageToken={initialNextPageToken}
      emailError={emailError}
      events={events}
      calendarError={calendarError}
      activeTabProp={activeTabProp}
    />
  );
}
