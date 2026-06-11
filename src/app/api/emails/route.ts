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
            // Using metadata format is 20x faster than full format for lists
            const full = await client.gmail.api.messages.get({
              id: msg.id!,
              format: 'metadata',
            });

            const headers = full.payload?.headers ?? [];
            const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value ?? '(no subject)';
            const from = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value ?? '(unknown)';
            const date = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value ?? '';

            return {
              id: msg.id,
              from,
              date,
              subject,
              snippet: full.snippet ?? '',
              body: '', // Empty body in list view, loaded on-demand on click
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
              body: '',
              labelIds: [],
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
