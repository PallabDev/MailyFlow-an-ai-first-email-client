import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair, ensureGoogleCredentialsSynced } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ConnectedAccount, GmailConfig, EmailItem, GmailMessageSummary, GmailHeader, CorsairEntityRow, GmailMessageDetails } from './_types';

export async function GET(req: NextRequest) {
  try {
    await ensureGoogleCredentialsSynced();

    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get('pageToken') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const folder = searchParams.get('folder') || 'inbox';

    // 1. Check if user has connected accounts
    let connectedAccounts: ConnectedAccount[] = [];
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
    const hasGmailConnection = !!gmailAccount && (gmailAccount.config as GmailConfig)?.access_token;
    const gmailTenantId = hasGmailConnection ? userId : 'dev';

    let emails: EmailItem[] = [];
    let apiNextPageToken: string | null = null;
    let fetchedFromGmail = false;

    if (hasGmailConnection) {
      try {
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

        // 4. Fetch list of messages from Gmail API
        const listRes = await client.gmail.api.messages.list({
          maxResults: limit,
          pageToken,
          labelIds,
        });

        const messages = listRes.messages as GmailMessageSummary[] | undefined;
        apiNextPageToken = listRes.nextPageToken || null;

        if (messages && messages.length > 0) {
          emails = await Promise.all(
            messages.map(async (msg: GmailMessageSummary) => {
              try {
                // Using metadata format is 20x faster than full format for lists
                const full = await client.gmail.api.messages.get({
                  id: msg.id!,
                  format: 'metadata',
                });

                const headers = (full.payload?.headers ?? []) as GmailHeader[];
                const subject = headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'subject')?.value ?? '(no subject)';
                const from = headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'from')?.value ?? '(unknown)';
                const date = headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'date')?.value ?? '';

                return {
                  id: msg.id!,
                  from,
                  date,
                  subject,
                  snippet: full.snippet ?? '',
                  body: '', // Empty body in list view, loaded on-demand on click
                  labelIds: full.labelIds ?? [],
                };
              } catch (e: unknown) {
                console.error(`Error fetching email details for message ID ${msg.id}:`, e);
                return {
                  id: msg.id!,
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
        fetchedFromGmail = true;
      } catch (gmailErr: unknown) {
        console.error('Error fetching directly from Gmail API, falling back to cache:', gmailErr);
        const errStr = gmailErr instanceof Error ? gmailErr.message : String(gmailErr);
        if (errStr.includes('unauthorized_client') || errStr.includes('invalid_grant')) {
          throw gmailErr;
        }
      }
    }

    // Fallback: If not fetched from Gmail (either because API failed or no connection), load from local cache
    if (!fetchedFromGmail && gmailAccount) {
      try {
        const rows = (await db
          .select()
          .from(corsairEntities)
          .where(
            and(
              eq(corsairEntities.accountId, gmailAccount.id),
              eq(corsairEntities.entityType, 'messages')
            )
          )) as CorsairEntityRow[];

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
          .map((r: CorsairEntityRow) => {
            const msg = r.data as GmailMessageDetails;
            const headers = (msg.payload?.headers ?? []) as GmailHeader[];
            const subject = msg.subject || headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'subject')?.value || '(no subject)';
            const from = msg.from || headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'from')?.value || '(unknown)';
            
            let date = msg.date;
            if (!date) {
              const headerDate = headers.find((h: GmailHeader) => h.name?.toLowerCase() === 'date')?.value;
              if (headerDate) {
                date = headerDate;
              } else if (msg.internalDate) {
                date = new Date(parseInt(msg.internalDate, 10)).toLocaleString();
              } else {
                date = '';
              }
            }

            return {
              id: msg.id!,
              from,
              date,
              subject,
              snippet: msg.snippet ?? '',
              body: msg.body ?? '',
              labelIds: msg.labelIds ?? [],
            };
          })
          .filter((msg: EmailItem) => {
            const msgLabels = msg.labelIds || [];
            return targetLabels.every(label => msgLabels.includes(label));
          });

        if (dbEmails.length > 0) {
          dbEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          emails = dbEmails.slice(0, limit);
          apiNextPageToken = null; // No pagination token for database cache fallback
        }
      } catch (dbErr) {
        console.error('Error fetching emails from local DB cache fallback:', dbErr);
      }
    }

    return NextResponse.json({
      emails,
      nextPageToken: apiNextPageToken,
      gmailTenantId,
      isDevFallback: !hasGmailConnection && emails.length === 0,
    });
  } catch (error: unknown) {
    console.error('Error in /api/emails:', error);
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
