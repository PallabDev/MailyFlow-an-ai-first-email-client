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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing email id parameter.' }, { status: 400 });
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

    // Fetch full message payload
    const full = await client.gmail.api.messages.get({
      id: id,
      format: 'full',
    });

    const headers = full.payload?.headers ?? [];
    const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value ?? '(no subject)';
    const from = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value ?? '(unknown)';
    const date = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value ?? '';

    let body = '(no body)';
    if (full.payload?.body?.data) {
      body = Buffer.from(full.payload.body.data, 'base64').toString('utf-8');
    } else if (full.payload?.parts) {
      const getBody = (parts: any[]): string => {
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
      body = getBody(full.payload.parts) || full.snippet || '(no body)';
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
  } catch (error: any) {
    console.error('Error in /api/emails/detail:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
