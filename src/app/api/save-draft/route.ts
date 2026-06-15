import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { corsair, hasActiveConnection } from '@/utils/corsair';

interface SaveDraftRequest {
  to: string;
  subject: string;
  body: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { to, subject, body } = (await req.json()) as SaveDraftRequest;
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing fields: to, subject, and body are required' }, { status: 400 });
    }

    // 1. Sanitize to prevent SMTP / Email Header Injection (deny newlines)
    if (/[\r\n]/.test(to) || /[\r\n]/.test(subject)) {
      return NextResponse.json({ error: 'Invalid characters in subject or recipient address.' }, { status: 400 });
    }

    // Validate recipient email address format(s)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const recipients = to.split(',').map(s => s.trim());
    for (const recipient of recipients) {
      if (!emailRegex.test(recipient)) {
        return NextResponse.json({ error: `Invalid recipient email format: ${recipient}` }, { status: 400 });
      }
    }

    // Determine active connection using hasActiveConnection helper
    const hasGmailConnection = await hasActiveConnection(userId, 'gmail');
    if (!hasGmailConnection) {
      return NextResponse.json({ error: 'Please connect your Gmail account on the onboarding page before creating drafts.' }, { status: 400 });
    }

    const client = corsair.withTenant(userId);

    // Encode standard email as base64url-encoded RFC 2822
    const raw = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
    ).toString('base64url');

    // Call Gmail draft creation API via Corsair integration client
    await client.gmail.api.drafts.create({
      draft: {
        message: {
          raw
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error saving draft email:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
