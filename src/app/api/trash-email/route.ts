import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair, hasActiveConnection } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { TrashEmailRequest } from './_types';

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

    // Check Gmail Connection via hasActiveConnection
    const hasGmailConnection = await hasActiveConnection(userId, 'gmail');
    if (!hasGmailConnection) {
      return NextResponse.json({ error: 'Please connect your Google Account first.' }, { status: 403 });
    }

    const client = corsair.withTenant(userId);

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

    // Query connected accounts for the active tenant to correctly resolve accountId in DB cache
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

    // Delete from local DB cache
    try {
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
