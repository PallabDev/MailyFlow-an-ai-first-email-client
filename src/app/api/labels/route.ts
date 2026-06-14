import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectedAccount, GmailConfig, LabelData } from './_types';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if user has connected accounts
    let connectedAccounts: ConnectedAccount[] = [];
    try {
      connectedAccounts = await db
        .select({
          id: corsairAccounts.id,
          name: corsairIntegrations.name,
          config: corsairAccounts.config,
        })
        .from(corsairAccounts)
        .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
        .where(eq(corsairAccounts.tenantId, userId));
    } catch (error) {
      console.error('Error querying connected accounts from DB:', error);
    }

    const gmailAccount = connectedAccounts.find(acc => acc.name === 'gmail');
    const hasGmailConnection = !!gmailAccount && (gmailAccount.config as GmailConfig)?.access_token;
    const gmailTenantId = hasGmailConnection ? userId : 'dev';

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Try to load counts from database cache first
    if (!forceRefresh && hasGmailConnection && gmailAccount) {
      try {
        const rows = await db
          .select()
          .from(corsairEntities)
          .where(
            and(
              eq(corsairEntities.accountId, gmailAccount.id),
              eq(corsairEntities.entityType, 'labels')
            )
          );

        const inboxRow = rows.find(r => r.entityId === 'INBOX');
        const draftsRow = rows.find(r => r.entityId === 'DRAFT');
        const spamRow = rows.find(r => r.entityId === 'SPAM');

        if (inboxRow || draftsRow || spamRow) {
          const isGmailConnected = connectedAccounts.some(acc => acc.name === 'gmail' && (acc.config as any)?.access_token);
          const isCalendarConnected = connectedAccounts.some(acc => acc.name === 'googlecalendar' && (acc.config as any)?.access_token);
          return NextResponse.json({
            inbox: {
              unread: inboxRow ? ((inboxRow.data as LabelData).messagesUnread ?? 0) : 0,
              total: inboxRow ? ((inboxRow.data as LabelData).messagesTotal ?? 0) : 0,
            },
            drafts: {
              total: draftsRow ? ((draftsRow.data as LabelData).messagesTotal ?? 0) : 0,
            },
            spam: {
              total: spamRow ? ((spamRow.data as LabelData).messagesTotal ?? 0) : 0,
            },
            connections: {
              gmail: isGmailConnected,
              calendar: isCalendarConnected
            }
          });
        }
      } catch (dbErr) {
        console.error('Error querying labels from DB cache:', dbErr);
      }
    }

    const client = corsair.withTenant(gmailTenantId);

    const handleLabelError = (err: unknown) => {
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('unauthorized_client') || errStr.includes('invalid_grant')) {
        throw err;
      }
      return null;
    };

    // Fetch inbox, drafts, spam label info from Gmail API (fallback)
    const [inbox, drafts, spam] = await Promise.all([
      client.gmail.api.labels.get({ id: 'INBOX' }).catch(handleLabelError),
      client.gmail.api.labels.get({ id: 'DRAFT' }).catch(handleLabelError),
      client.gmail.api.labels.get({ id: 'SPAM' }).catch(handleLabelError),
    ]);

    const isGmailConnected = connectedAccounts.some(acc => acc.name === 'gmail' && (acc.config as any)?.access_token);
    const isCalendarConnected = connectedAccounts.some(acc => acc.name === 'googlecalendar' && (acc.config as any)?.access_token);
    return NextResponse.json({
      inbox: {
        unread: inbox?.messagesUnread ?? 0,
        total: inbox?.messagesTotal ?? 0,
      },
      drafts: {
        total: drafts?.messagesTotal ?? 0,
      },
      spam: {
        total: spam?.messagesTotal ?? 0,
      },
      connections: {
        gmail: isGmailConnected,
        calendar: isCalendarConnected
      }
    });
  } catch (error: unknown) {
    console.error('Error in /api/labels:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
