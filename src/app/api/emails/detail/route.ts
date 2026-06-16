import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectedAccount, GmailConfig, GmailHeader, GmailPart } from './_types';

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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing email id parameter.' }, { status: 400 });
    }

    // Check if user has connected accounts
    let connectedAccounts: ConnectedAccount[] = [];
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
      acc => acc.name === 'gmail' && (acc.config as GmailConfig)?.access_token
    );

    if (!hasGmailConnection) {
      return NextResponse.json({ error: 'Please connect your Gmail account to view email details.' }, { status: 403 });
    }

    // Find the account row to get the account ID for caching
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

    // Check if Gmail is currently rate-limited (cooldown)
    const cooldownExpiry = (global as any)._gmailCooldownExpiration;
    const isCooldownActive = cooldownExpiry && Date.now() < cooldownExpiry;

    if (isCooldownActive) {
      if (gmailAccount) {
        // Look up in database entities cache
        const cacheRow = await db
          .select()
          .from(corsairEntities)
          .where(
            and(
              eq(corsairEntities.accountId, gmailAccount.id),
              eq(corsairEntities.entityId, id),
              eq(corsairEntities.entityType, 'messages')
            )
          )
          .limit(1)
          .then(rows => rows[0]);

        if (cacheRow) {
          const cachedData = cacheRow.data as any;
          return NextResponse.json({
            id: cachedData.id,
            from: cachedData.from,
            date: cachedData.date,
            subject: cachedData.subject,
            snippet: cachedData.snippet || '',
            body: cachedData.body || cachedData.snippet || '(Offline/Cooldown: Email body not cached)',
            labelIds: cachedData.labelIds || [],
            internalDate: cachedData.internalDate || undefined,
            isCached: true,
          });
        }
      }

      return NextResponse.json({
        error: 'Gmail rate limit is active. Please wait a few minutes before viewing this email details.'
      }, { status: 429 });
    }

    const client = corsair.withTenant(userId);

    // Fetch full message payload
    let full: any = null;
    try {
      full = await client.gmail.api.messages.get({
        id: id,
        format: 'full',
      });
    } catch (apiErr) {
      if (is429Error(apiErr)) {
        console.warn('[Emails Detail API] Gmail API returned 429. Setting 20-minute cooldown.');
        (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
      }
      throw apiErr;
    }

    // Mark as read in Gmail (remove UNREAD label if it exists in labelIds)
    if (full.labelIds && full.labelIds.includes('UNREAD')) {
      try {
        await client.gmail.api.messages.batchModify({
          ids: [id],
          removeLabelIds: ['UNREAD'],
        });
      } catch (err) {
        console.error('Failed to mark message as read in Gmail:', err);
        if (is429Error(err)) {
          console.warn('[Emails Detail API] batchModify returned 429. Setting 20-minute cooldown.');
          (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
        }
      }
    }

    const headers = (full.payload?.headers ?? []) as GmailHeader[];
    const subject = headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'subject')?.value ?? '(no subject)';
    const from = headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'from')?.value ?? '(unknown)';
    const date = headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'date')?.value ?? '';

    let body = '(no body)';
    if (full.payload?.body?.data) {
      body = Buffer.from(full.payload.body.data, 'base64').toString('utf-8');
    } else if (full.payload?.parts) {
      const getBody = (parts: GmailPart[]): string => {
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
      body = getBody(full.payload.parts as GmailPart[]) || full.snippet || '(no body)';
    } else {
      body = full.snippet ?? '(no body)';
    }

    // Cache the fetched email details in the database
    if (gmailAccount) {
      try {
        const entityRowId = `e_messages_${full.id}_a_${gmailAccount.id}`;
        const entityData = {
          id: full.id,
          snippet: full.snippet || '',
          subject,
          from,
          date,
          body,
          labelIds: full.labelIds || [],
          internalDate: full.internalDate || undefined,
          payload: {
            headers: headers
          }
        };

        await db
          .insert(corsairEntities)
          .values({
            id: entityRowId,
            accountId: gmailAccount.id,
            entityId: full.id,
            entityType: 'messages',
            version: '1',
            data: entityData,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: corsairEntities.id,
            set: {
              data: entityData,
              updatedAt: new Date(),
            }
          });
        console.log(`💾 [Emails Detail API] Successfully cached email details in DB: ${full.id}`);
      } catch (cacheErr) {
        console.error('Failed to cache fetched email details in DB:', cacheErr);
      }
    }

    return NextResponse.json({
      id: full.id,
      from,
      date,
      subject,
      snippet: full.snippet ?? '',
      body,
      labelIds: full.labelIds ?? [],
      internalDate: full.internalDate || undefined,
    });
  } catch (error: unknown) {
    console.error('Error in /api/emails/detail:', error);
    if (is429Error(error)) {
      console.warn('[Emails Detail API] Outer handler caught 429. Setting 20-minute cooldown.');
      (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
    }
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
