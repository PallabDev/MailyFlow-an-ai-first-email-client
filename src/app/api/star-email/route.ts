import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair, hasActiveConnection } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id, starred } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Check Gmail Connection via hasActiveConnection
    const hasGmailConnection = await hasActiveConnection(userId, 'gmail');
    if (!hasGmailConnection) {
      return NextResponse.json({ error: 'Please connect your Google Account first.' }, { status: 403 });
    }

    const client = corsair.withTenant(userId);

    // Call Gmail API to modify labels
    await client.gmail.api.messages.modify({
      id,
      addLabelIds: starred ? ['STARRED'] : [],
      removeLabelIds: starred ? [] : ['STARRED'],
    });

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

    if (gmailAccount) {
      try {
        const [existing] = await db
          .select({ data: corsairEntities.data })
          .from(corsairEntities)
          .where(
            and(
              eq(corsairEntities.accountId, gmailAccount.id),
              eq(corsairEntities.entityId, id)
            )
          )
          .limit(1);

        if (existing) {
          const currentData = existing.data as any;
          const currentLabels = currentData.labelIds || [];
          let updatedLabels: string[];
          if (starred) {
            updatedLabels = currentLabels.includes('STARRED') ? currentLabels : [...currentLabels, 'STARRED'];
          } else {
            updatedLabels = currentLabels.filter((l: string) => l !== 'STARRED');
          }

          const updatedData = { ...currentData, labelIds: updatedLabels };
          await db
            .update(corsairEntities)
            .set({ data: updatedData, updatedAt: new Date() })
            .where(
              and(
                eq(corsairEntities.accountId, gmailAccount.id),
                eq(corsairEntities.entityId, id)
              )
            );
        }
      } catch (dbErr) {
        console.error('Error updating cache in DB during star toggle:', dbErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error toggling email star:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
