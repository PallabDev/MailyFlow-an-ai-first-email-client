import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
          id: corsairAccounts.id,
          name: corsairIntegrations.name,
          config: corsairAccounts.config,
        })
        .from(corsairAccounts)
        .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
        .where(eq(corsairAccounts.tenantId, userId));
    } catch (error) {
      console.error('Error querying connected accounts from DB:', error);
    }

    const gmailAccount = connectedAccounts.find(acc => acc.name === 'gmail');
    const hasGmailConnection = !!gmailAccount && (gmailAccount.config as any)?.access_token;
    const gmailTenantId = hasGmailConnection ? userId : 'dev';

    const forceRefresh = searchParams.get('refresh') === 'true';

    // 2. Try to fetch from database cache first to bypass external API latency
    if (!forceRefresh && hasGmailConnection && gmailAccount) {
      try {
        const rows = await db
          .select()
          .from(corsairEntities)
          .where(
            and(
              eq(corsairEntities.accountId, gmailAccount.id),
              eq(corsairEntities.entityType, 'messages')
            )
          );

        const sortedRows = [...rows].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        const lastUpdated = sortedRows[0]?.updatedAt;
        const secondsSinceUpdate = lastUpdated ? (Date.now() - lastUpdated.getTime()) / 1000 : 999;

        const labelIdsMap: Record<string, string[]> = {
          inbox: ['INBOX'],
          drafts: ['DRAFT'],
          draft: ['DRAFT'],
          sent: ['SENT'],
          spam: ['SPAM'],
          trash: ['TRASH'],
        };
        const targetLabels = labelIdsMap[folder] || ['INBOX'];

        const dbEmails = rows
          .map((r: any) => {
            const msg = r.data;
            const headers = msg.payload?.headers ?? [];
            const subject = msg.subject || headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '(no subject)';
            const from = msg.from || headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '(unknown)';
            
            let date = msg.date;
            if (!date) {
              const headerDate = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value;
              if (headerDate) {
                date = headerDate;
              } else if (msg.internalDate) {
                date = new Date(parseInt(msg.internalDate, 10)).toLocaleString();
              } else {
                date = '';
              }
            }

            return {
              id: msg.id,
              from,
              date,
              subject,
              snippet: msg.snippet ?? '',
              body: msg.body ?? '',
              labelIds: msg.labelIds ?? [],
            };
          })
          .filter((msg: any) => {
            const msgLabels = msg.labelIds || [];
            return targetLabels.every(label => msgLabels.includes(label));
          });

        if (dbEmails.length > 0) {
          // Sort by date descending
          dbEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Trigger asynchronous background cache refresh if data is older than 30 seconds
          if (secondsSinceUpdate > 30) {
            (async () => {
              try {
                const client = corsair.withTenant(gmailTenantId);
                const { messages } = await client.gmail.api.messages.list({
                  maxResults: 10,
                  labelIds: targetLabels,
                });
                if (messages && messages.length > 0) {
                  await Promise.all(
                    messages.map(async (msg: any) => {
                      await client.gmail.api.messages.get({
                        id: msg.id!,
                        format: 'metadata',
                      });
                    })
                  );
                }
              } catch (syncErr) {
                console.error('Background cache sync failed:', syncErr);
              }
            })();
          }

          return NextResponse.json({
            emails: dbEmails.slice(0, limit),
            nextPageToken: null,
            gmailTenantId,
            isDevFallback: false,
          });
        }
      } catch (dbErr) {
        console.error('Error fetching emails from local DB cache:', dbErr);
      }
    }

    const client = corsair.withTenant(gmailTenantId);

    // 3. Map folder to Gmail system label IDs
    const labelIdsMap: Record<string, string[]> = {
      inbox: ['INBOX'],
      drafts: ['DRAFT'],
      draft: ['DRAFT'],
      sent: ['SENT'],
      spam: ['SPAM'],
      trash: ['TRASH'],
    };
    const labelIds = labelIdsMap[folder] || ['INBOX'];

    // 4. Fetch list of messages from Gmail API (only if cache is empty)
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
