import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if user has connected accounts
    let connectedAccounts: any[] = [];
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
    const hasGmailConnection = !!gmailAccount && (gmailAccount.config as any)?.access_token;
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
          return NextResponse.json({
            inbox: {
              unread: inboxRow ? ((inboxRow.data as any).messagesUnread ?? 0) : 0,
              total: inboxRow ? ((inboxRow.data as any).messagesTotal ?? 0) : 0,
            },
            drafts: {
              total: draftsRow ? ((draftsRow.data as any).messagesTotal ?? 0) : 0,
            },
            spam: {
              total: spamRow ? ((spamRow.data as any).messagesTotal ?? 0) : 0,
            }
          });
        }
      } catch (dbErr) {
        console.error('Error querying labels from DB cache:', dbErr);
      }
    }

    const client = corsair.withTenant(gmailTenantId);

    // Fetch inbox, drafts, spam label info from Gmail API (fallback)
    const [inbox, drafts, spam] = await Promise.all([
      client.gmail.api.labels.get({ id: 'INBOX' }).catch(() => null),
      client.gmail.api.labels.get({ id: 'DRAFT' }).catch(() => null),
      client.gmail.api.labels.get({ id: 'SPAM' }).catch(() => null),
    ]);

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
      }
    });
  } catch (error: any) {
    console.error('Error in /api/labels:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
