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
    const pageToken = searchParams.get('pageToken') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const folder = searchParams.get('folder') || 'inbox';

    // 1. Check if user has connected accounts
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

    // 2. Map folder to Gmail system label IDs
    const labelIdsMap: Record<string, string[]> = {
      inbox: ['INBOX'],
      drafts: ['DRAFT'],
      draft: ['DRAFT'],
      sent: ['SENT'],
      spam: ['SPAM'],
      trash: ['TRASH'],
    };
    const labelIds = labelIdsMap[folder] || ['INBOX'];

    // 3. Fetch list of messages
    const { messages, nextPageToken } = await client.gmail.api.messages.list({
      maxResults: limit,
      pageToken,
      labelIds,
    });

    let emails: any[] = [];
    if (messages && messages.length > 0) {
      emails = await Promise.all(
        messages.map(async (msg: any) => {
          try {
            const full = await client.gmail.api.messages.get({
              id: msg.id!,
              format: 'full',
            });

            const headers = full.payload?.headers ?? [];
            const subject = headers.find((h: any) => h.name === 'Subject')?.value ?? '(no subject)';
            const from = headers.find((h: any) => h.name === 'From')?.value ?? '(unknown)';
            const date = headers.find((h: any) => h.name === 'Date')?.value ?? '';

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

            return {
              id: msg.id,
              from,
              date,
              subject,
              snippet: full.snippet ?? '',
              body,
              labelIds: full.labelIds ?? [],
            };
          } catch (e: any) {
            console.error(`Error fetching email details for message ID ${msg.id}:`, e);
            return {
              id: msg.id,
              from: '(unknown)',
              date: '',
              subject: '(failed to load email content)',
              snippet: '',
              body: e.message || 'Error details parsing email',
            };
          }
        })
      );
    }

    return NextResponse.json({
      emails,
      nextPageToken: nextPageToken || null,
      gmailTenantId,
      isDevFallback: !hasGmailConnection,
    });
  } catch (error: any) {
    console.error('Error in /api/emails:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
