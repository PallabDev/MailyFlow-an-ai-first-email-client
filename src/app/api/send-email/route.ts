import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { corsair, hasActiveConnection } from '@/utils/corsair';
import { SendEmailRequest } from './_types';

function buildRawMimeMessage({
  to,
  subject,
  body,
  attachments,
}: {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{ name: string; type: string; base64: string }>;
}) {
  if (!attachments || attachments.length === 0) {
    return Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
    ).toString('base64url');
  }

  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  let mime = `To: ${to}\r\n`;
  mime += `Subject: ${subject}\r\n`;
  mime += `MIME-Version: 1.0\r\n`;
  mime += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  // Message body part
  mime += `--${boundary}\r\n`;
  mime += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
  mime += `${body}\r\n\r\n`;

  // Attachments parts
  for (const file of attachments) {
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: ${file.type || 'application/octet-stream'}\r\n`;
    mime += `Content-Disposition: attachment; filename="${file.name}"\r\n`;
    mime += `Content-Transfer-Encoding: base64\r\n\r\n`;
    
    // Remove base64 data prefix if present (e.g. data:image/png;base64,...)
    const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
    mime += `${base64Data}\r\n\r\n`;
  }

  mime += `--${boundary}--`;
  return Buffer.from(mime).toString('base64url');
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { to, subject, body, attachments } = (await req.json()) as SendEmailRequest;
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
      return NextResponse.json({ error: 'Please connect your Gmail account on the onboarding page before sending emails.' }, { status: 400 });
    }

    const client = corsair.withTenant(userId);

    // Encode standard email as base64url-encoded RFC 2822
    const raw = buildRawMimeMessage({ to, subject, body, attachments });

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
