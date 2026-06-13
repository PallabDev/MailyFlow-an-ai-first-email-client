import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id, permanently } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
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

    // Filter only active connections
    const activeConnections = connectedAccounts.filter(acc => {
      const cfg = acc.config as any;
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

    // Delete from local DB cache
    try {
      const gmailAccount = connectedAccounts.find(acc => acc.name === 'gmail');
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
  } catch (error: any) {
    console.error('Error trashing email:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
