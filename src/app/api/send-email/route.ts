import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SendEmailRequest, ConnectedAccountBasic } from './_types';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { to, subject, body } = (await req.json()) as SendEmailRequest;
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing fields: to, subject, and body are required' }, { status: 400 });
    }

    // Determine active tenant id
    let connectedAccounts: ConnectedAccountBasic[] = [];
    try {
      connectedAccounts = await db
        .select({ name: corsairIntegrations.name })
        .from(corsairAccounts)
        .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
        .where(eq(corsairAccounts.tenantId, userId));
    } catch (e) {
      console.error('Error fetching connected accounts:', e);
    }
    const activeTenantId = connectedAccounts.length > 0 ? userId : 'dev';
    const client = corsair.withTenant(activeTenantId);

    // Encode standard email as base64url-encoded RFC 2822
    const raw = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
    ).toString('base64url');

    await client.gmail.api.messages.send({ raw });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
