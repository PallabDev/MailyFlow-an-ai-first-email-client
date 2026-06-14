import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ConnectedAccount, GmailConfig, GmailHeader, GmailPart } from './_types';

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

    const client = corsair.withTenant(userId);

    // Fetch full message payload
    const full = await client.gmail.api.messages.get({
      id: id,
      format: 'full',
    });

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

    return NextResponse.json({
      id: full.id,
      from,
      date,
      subject,
      snippet: full.snippet ?? '',
      body,
      labelIds: full.labelIds ?? [],
    });
  } catch (error: unknown) {
    console.error('Error in /api/emails/detail:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
