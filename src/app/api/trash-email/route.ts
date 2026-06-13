import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { TrashEmailRequest, ConnectedAccount, GmailConfig } from './_types';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id, permanently } = (await req.json()) as TrashEmailRequest;
    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // 1. Check if user has active connected accounts under their userId
    let userConnectedAccounts: ConnectedAccount[] = [];
    try {
      userConnectedAccounts = await db
        .select({
          id: corsairAccounts.id,
          name: corsairIntegrations.name,
          config: corsairAccounts.config,
        })
        .from(corsairAccounts)
        .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
        .where(eq(corsairAccounts.tenantId, userId));
    } catch (error) {
      console.error('Error querying user connected accounts from DB:', error);
    }

    // Filter only active connections
    const activeConnections = userConnectedAccounts.filter(acc => {
      const cfg = acc.config as GmailConfig;
      return cfg && cfg.access_token;
    });

    const hasUserConnections = activeConnections.length > 0;
    const activeTenantId = hasUserConnections ? userId : 'dev';

    const client = corsair.withTenant(activeTenantId);

    // Call Gmail API to trash or delete the message
    if (permanently) {
      await client.gmail.api.messages.delete({
        id,
      });
    } else {
      await client.gmail.api.messages.trash({
        id,
      });
    }

    // 2. Query connected accounts for the active tenant to correctly resolve accountId in DB cache
    let activeConnectedAccounts = userConnectedAccounts;
    if (activeTenantId === 'dev') {
      try {
        activeConnectedAccounts = await db
          .select({
            id: corsairAccounts.id,
            name: corsairIntegrations.name,
            config: corsairAccounts.config,
          })
          .from(corsairAccounts)
          .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
          .where(eq(corsairAccounts.tenantId, 'dev'));
      } catch (error) {
        console.error('Error querying dev connected accounts from DB:', error);
      }
    }

    // Delete from local DB cache
    try {
      const gmailAccount = activeConnectedAccounts.find(acc => acc.name === 'gmail');
      if (gmailAccount) {
        await db
          .delete(corsairEntities)
          .where(
            and(
              eq(corsairEntities.accountId, gmailAccount.id),
              eq(corsairEntities.entityId, id)
            )
          );
      }
    } catch (dbErr) {
      console.error('Error deleting message from DB cache during trash:', dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error trashing email:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
