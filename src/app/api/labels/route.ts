import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair, hasActiveConnection } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { LabelData } from './_types';

const is429Error = (err: any): boolean => {
  if (!err) return false;
  const errMsg = String(err.message || err.error || err).toLowerCase();
  return (
    err.status === 429 ||
    err.statusCode === 429 ||
    err.body?.error?.code === 429 ||
    errMsg.includes('too many requests') ||
    errMsg.includes('resource_exhausted') ||
    errMsg.includes('rate limit')
  );
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if user has active connected accounts
    const hasGmailConnection = await hasActiveConnection(userId, 'gmail');
    if (!hasGmailConnection) {
      return NextResponse.json({ error: 'Please connect your Google Account first.' }, { status: 403 });
    }

    // Fetch the account row to resolve cache
    const gmailAccount = await db
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          eq(corsairIntegrations.name, 'gmail')
        )
      )
      .limit(1)
      .then(rows => rows[0]);

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Check if Gmail is currently rate-limited (cooldown)
    const cooldownExpiry = (global as any)._gmailCooldownExpiration;
    const isCooldownActive = cooldownExpiry && Date.now() < cooldownExpiry;

    // Try to load counts from database cache first
    if ((!forceRefresh || isCooldownActive) && gmailAccount) {
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

        if (inboxRow || draftsRow || spamRow || isCooldownActive) {
          const isGmailConnected = await hasActiveConnection(userId, 'gmail');
          const isCalendarConnected = await hasActiveConnection(userId, 'googlecalendar');
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

    const client = corsair.withTenant(userId);

    const handleLabelError = (err: unknown) => {
      const errStr = err instanceof Error ? err.message : String(err);
      if (is429Error(err)) {
        console.warn('[Labels GET API] Gmail API returned 429. Setting 20-minute cooldown.');
        (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
      }
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

    const isGmailConnected = await hasActiveConnection(userId, 'gmail');
    const isCalendarConnected = await hasActiveConnection(userId, 'googlecalendar');
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
    if (is429Error(error)) {
      console.warn('[Labels GET API] Outer handler caught 429. Setting 20-minute cooldown.');
      (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
    }
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
