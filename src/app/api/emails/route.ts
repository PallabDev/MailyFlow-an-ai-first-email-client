import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair, ensureGoogleCredentialsSynced, hasActiveConnection } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { EmailItem, GmailMessageSummary, GmailHeader, CorsairEntityRow, GmailMessageDetails } from './_types';
import { checkRateLimit } from '@/utils/rate-limit';

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
    await ensureGoogleCredentialsSynced();

    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rateLimit = await checkRateLimit(userId, 'gmail');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.error }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get('pageToken') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const folder = searchParams.get('folder') || 'inbox';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Check Gmail Connection via hasActiveConnection
    const hasGmailConnection = await hasActiveConnection(userId, 'gmail');
    if (!hasGmailConnection) {
      return NextResponse.json({ error: 'Please connect your Gmail account on the onboarding page before fetching emails.' }, { status: 403 });
    }

    // Check if Gmail is currently rate-limited (cooldown)
    const cooldownExpiry = (global as any)._gmailCooldownExpiration;
    const isCooldownActive = cooldownExpiry && Date.now() < cooldownExpiry;

    let emails: EmailItem[] = [];
    let apiNextPageToken: string | null = null;
    let fetchedFromGmail = false;

    // Fetch the account row to get the account ID for querying entities cache
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

    const labelIdsMap: Record<string, string[]> = {
      inbox: ['INBOX'],
      drafts: ['DRAFT'],
      draft: ['DRAFT'],
      sent: ['SENT'],
      spam: ['SPAM'],
      trash: ['TRASH'],
    };
    const targetLabels = labelIdsMap[folder] || ['INBOX'];

    // 1. Try DB cache first if not forceRefresh or if cooldown is active
    if ((!forceRefresh || isCooldownActive) && gmailAccount) {
      try {
        let offset = 0;
        if (pageToken && pageToken.startsWith('db_offset:')) {
          offset = parseInt(pageToken.split(':')[1], 10) || 0;
        }

        const rows = (await db
          .select()
          .from(corsairEntities)
          .where(
            and(
              eq(corsairEntities.accountId, gmailAccount.id),
              eq(corsairEntities.entityType, 'messages'),
              sql`${corsairEntities.data}->'labelIds' @> ${JSON.stringify(targetLabels)}::jsonb`
            )
          )
          .orderBy(desc(sql`coalesce((${corsairEntities.data}->>'internalDate')::bigint, extract(epoch from ${corsairEntities.createdAt})::bigint * 1000)`))
          .limit(limit)
          .offset(offset)) as CorsairEntityRow[];

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

            let internalDate = msg.internalDate;
            if (!internalDate && date) {
              const parsed = Date.parse(date);
              if (!isNaN(parsed)) {
                internalDate = String(parsed);
              }
            }

            return {
              id: msg.id!,
              from,
              date,
              subject,
              snippet: msg.snippet ?? '',
              body: '', // Empty body in list view to save network/DB egress
              labelIds: msg.labelIds ?? [],
              internalDate: internalDate || undefined,
            };
          });

        if (dbEmails.length > 0) {
          emails = dbEmails;
          if (rows.length === limit) {
            apiNextPageToken = `db_offset:${offset + limit}`;
          } else {
            apiNextPageToken = null;
          }
          fetchedFromGmail = true;
        }
      } catch (dbErr) {
        console.error('Error fetching emails from DB cache:', dbErr);
      }
    }

    // 2. Fetch directly from Gmail API if cache is empty or forceRefresh is true (and no active cooldown)
    if (!fetchedFromGmail && !isCooldownActive) {
      try {
        const client = corsair.withTenant(userId);

        const labelIdsMap: Record<string, string[]> = {
          inbox: ['INBOX'],
          drafts: ['DRAFT'],
          draft: ['DRAFT'],
          sent: ['SENT'],
          spam: ['SPAM'],
          trash: ['TRASH'],
        };
        const labelIds = labelIdsMap[folder] || ['INBOX'];

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
                  internalDate: full.internalDate || undefined,
                };
              } catch (e: unknown) {
                console.error(`Error fetching email details for message ID ${msg.id}:`, e);
                if (is429Error(e)) {
                  console.warn('[Emails GET API] Gmail message get returned 429. Setting 20-minute cooldown.');
                  (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
                }
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

          // Save/update the database cache (corsair_entities)
          if (gmailAccount) {
            try {
              for (const email of emails) {
                const entityRowId = `e_messages_${email.id}_a_${gmailAccount.id}`;
                const entityData = {
                  id: email.id,
                  snippet: email.snippet,
                  subject: email.subject,
                  from: email.from,
                  date: email.date,
                  labelIds: email.labelIds,
                  internalDate: email.internalDate || undefined,
                  payload: {
                    headers: [
                      { name: 'Subject', value: email.subject },
                      { name: 'From', value: email.from },
                      { name: 'Date', value: email.date }
                    ]
                  }
                };

                await db
                  .insert(corsairEntities)
                  .values({
                    id: entityRowId,
                    accountId: gmailAccount.id,
                    entityId: email.id,
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
              }
            } catch (cacheErr) {
              console.error('Failed to cache fetched emails in database:', cacheErr);
            }
          }
        }
        fetchedFromGmail = true;
      } catch (gmailErr: unknown) {
        console.error('Error fetching directly from Gmail API, trying to fallback to cache:', gmailErr);
        if (is429Error(gmailErr)) {
          console.warn('[Emails GET API] Gmail API list returned 429. Setting 20-minute cooldown.');
          (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
        }

        const errStr = gmailErr instanceof Error ? gmailErr.message : String(gmailErr);
        if (errStr.includes('unauthorized_client') || errStr.includes('invalid_grant')) {
          throw gmailErr;
        }

        // Fallback to cache if Gmail API fails
        if (gmailAccount) {
          try {
            let offset = 0;
            if (pageToken && pageToken.startsWith('db_offset:')) {
              offset = parseInt(pageToken.split(':')[1], 10) || 0;
            }

            const rows = (await db
              .select()
              .from(corsairEntities)
              .where(
                and(
                  eq(corsairEntities.accountId, gmailAccount.id),
                  eq(corsairEntities.entityType, 'messages'),
                  sql`${corsairEntities.data}->'labelIds' @> ${JSON.stringify(targetLabels)}::jsonb`
                )
              )
              .orderBy(desc(sql`coalesce((${corsairEntities.data}->>'internalDate')::bigint, extract(epoch from ${corsairEntities.createdAt})::bigint * 1000)`))
              .limit(limit)
              .offset(offset)) as CorsairEntityRow[];

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

                let internalDate = msg.internalDate;
                if (!internalDate && date) {
                  const parsed = Date.parse(date);
                  if (!isNaN(parsed)) {
                    internalDate = String(parsed);
                  }
                }

                return {
                  id: msg.id!,
                  from,
                  date,
                  subject,
                  snippet: msg.snippet ?? '',
                  body: '', // Empty body in list view to save network/DB egress
                  labelIds: msg.labelIds ?? [],
                  internalDate: internalDate || undefined,
                };
              });

            if (dbEmails.length > 0) {
              emails = dbEmails;
              if (rows.length === limit) {
                apiNextPageToken = `db_offset:${offset + limit}`;
              } else {
                apiNextPageToken = null;
              }
            }
          } catch (dbErr) {
            console.error('Error fetching emails from local DB cache fallback:', dbErr);
          }
        }
      }
    }

    return NextResponse.json({
      emails,
      nextPageToken: apiNextPageToken,
      isDevFallback: false,
    });
  } catch (error: unknown) {
    console.error('Error in /api/emails:', error);
    if (is429Error(error)) {
      console.warn('[Emails GET API] Outer handler caught 429. Setting 20-minute cooldown.');
      (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
    }
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
