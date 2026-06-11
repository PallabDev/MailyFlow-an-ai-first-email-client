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

    // Check if user has connected accounts
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

    const hasGmailConnection = connectedAccounts.some(
      acc => acc.name === 'gmail' && (acc.config as any)?.access_token
    );
    const gmailTenantId = hasGmailConnection ? userId : 'dev';

    const client = corsair.withTenant(gmailTenantId);

    // Fetch inbox, drafts, spam label info
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
