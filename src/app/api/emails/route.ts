import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair, ensureGoogleCredentialsSynced } from '@/lib/corsair';
import { hasActiveConnection } from '@/lib/corsair/utils';
import { corsairAccounts, corsairIntegrations, corsairEntities, emailPriorities } from '@/server/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { getGmailCooldownExpiration, setGmailCooldown } from '@/lib/cooldown';
import { EmailItem, GmailMessageSummary, GmailHeader, CorsairEntityRow, GmailMessageDetails } from './_types';
import { checkRateLimit } from '@/lib/rate-limit';
import { setLastSyncTime } from '@/lib/webhook-dedup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

interface ParsedQuery {
  from?: string;
  to?: string;
  subject?: string;
  label?: string;
  hasAttachment: boolean;
  terms: string[];
}

function parseGmailQuery(q: string): ParsedQuery {
  const terms: string[] = [];
  let from: string | undefined;
  let to: string | undefined;
  let subject: string | undefined;
  let label: string | undefined;
  let hasAttachment = false;

  const regex = /(?:([a-zA-Z]+):(?:"([^"]+)"|([^\s"]+)))|(?:"([^"]+)"|([^\s"]+))/g;
  let match;
  while ((match = regex.exec(q)) !== null) {
    if (match[1]) {
      const key = match[1].toLowerCase();
      const val = match[2] || match[3];
      if (key === 'from') {
        from = val;
      } else if (key === 'to') {
        to = val;
      } else if (key === 'subject') {
        subject = val;
      } else if (key === 'label' || key === 'in') {
        label = val;
      } else if (key === 'has') {
        if (val.toLowerCase() === 'attachment') {
          hasAttachment = true;
        }
      }
    } else {
      const term = match[4] || match[5];
      if (term) {
        terms.push(term);
      }
    }
  }

  return { from, to, subject, label, hasAttachment, terms };
}

/** Detect if a search string looks like a date (e.g. "2026-06-18", "june 18", "18 june", "yesterday", "today") */
function detectDateRange(q: string): { after?: string; before?: string } | null {
  const lower = q.toLowerCase().trim();

  // Exact date: 2026-06-18 or 2026/06/18
  const isoMatch = lower.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    return { after: date, before: date };
  }

  // "today"
  if (lower === 'today') {
    const today = new Date().toISOString().split('T')[0];
    return { after: today, before: today };
  }

  // "yesterday"
  if (lower === 'yesterday') {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    return { after: yesterday, before: yesterday };
  }

  // "last week"
  if (lower === 'last week') {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    return { after: start, before: end };
  }

  // "last month"
  if (lower === 'last month') {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    return { after: start, before: end };
  }

  // Month name + day: "june 18", "18 june", "jun 18"
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const monthDayMatch = lower.match(/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})$/);
  if (monthDayMatch) {
    const monthNum = months[monthDayMatch[1]];
    const day = monthDayMatch[2].padStart(2, '0');
    const year = new Date().getFullYear();
    const date = `${year}-${monthNum}-${day}`;
    return { after: date, before: date };
  }
  const dayMonthMatch = lower.match(/^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)$/);
  if (dayMonthMatch) {
    const monthNum = months[dayMonthMatch[2]];
    const day = dayMonthMatch[1].padStart(2, '0');
    const year = new Date().getFullYear();
    const date = `${year}-${monthNum}-${day}`;
    return { after: date, before: date };
  }

  return null;
}

export async function GET(req: NextRequest) {
  let userId: string | null = null;
  try {
    await ensureGoogleCredentialsSynced();

    const authResult = await auth();
    userId = authResult.userId;
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
    const q = searchParams.get('q') || undefined;

    // Check Gmail Connection via hasActiveConnection
    const hasGmailConnection = await hasActiveConnection(userId, 'gmail');
    if (!hasGmailConnection) {
      return NextResponse.json({ error: 'Please connect your Gmail account on the onboarding page before fetching emails.' }, { status: 403 });
    }

    // Check if Gmail is currently rate-limited (cooldown)
    const cooldownExpiry = await getGmailCooldownExpiration(userId);
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
      starred: ['STARRED'],
      drafts: ['DRAFT'],
      draft: ['DRAFT'],
      sent: ['SENT'],
      spam: ['SPAM'],
      trash: ['TRASH'],
      promotions: ['CATEGORY_PROMOTIONS'],
    };
    const targetLabels = labelIdsMap[folder] || ['INBOX'];

    // 1. Try DB cache first if (no search query and not forceRefresh) or if cooldown is active
    const isDbToken = !pageToken || pageToken.startsWith('db_offset:');
    const shouldTryCache = (isDbToken && !forceRefresh && !q) || isCooldownActive;
    if (shouldTryCache && gmailAccount) {
      try {
        let offset = 0;
        if (pageToken && pageToken.startsWith('db_offset:')) {
          offset = parseInt(pageToken.split(':')[1], 10) || 0;
        }

        const conditions = [
          eq(corsairEntities.accountId, gmailAccount.id),
          eq(corsairEntities.entityType, 'messages'),
          sql`${corsairEntities.id} LIKE 'e_messages_%'`,
        ];

        const hasLabelFilter = q ? /\b(in|label|is|category):/i.test(q) : false;
        const parsedQuery = q ? parseGmailQuery(q) : null;

        if (hasLabelFilter && parsedQuery) {
          if (parsedQuery.label) {
            const labelUpper = parsedQuery.label.toUpperCase();
            let resolvedLabel = labelUpper;
            if (labelUpper === 'DRAFTS') resolvedLabel = 'DRAFT';
            if (labelUpper === 'SENT') resolvedLabel = 'SENT';
            if (labelUpper === 'SPAM') resolvedLabel = 'SPAM';
            if (labelUpper === 'TRASH') resolvedLabel = 'TRASH';
            if (labelUpper === 'STARRED') resolvedLabel = 'STARRED';
            if (labelUpper === 'INBOX') resolvedLabel = 'INBOX';

            if (resolvedLabel !== 'ANYWHERE') {
              conditions.push(sql`${corsairEntities.data}->'labelIds' @> ${JSON.stringify([resolvedLabel])}::jsonb`);
            }
          }
        } else {
          conditions.push(sql`${corsairEntities.data}->'labelIds' @> ${JSON.stringify(targetLabels)}::jsonb`);
        }

        if (parsedQuery) {
          // Date detection: if user typed "today", "yesterday", "june 18", etc.
          const dateRange = q ? detectDateRange(q) : null;
          if (dateRange) {
            if (dateRange.after) {
              const afterTs = new Date(dateRange.after + 'T00:00:00Z').getTime();
              conditions.push(sql`(${corsairEntities.data}->>'internalDate')::bigint >= ${afterTs}`);
            }
            if (dateRange.before) {
              const beforeTs = new Date(dateRange.before + 'T23:59:59Z').getTime();
              conditions.push(sql`(${corsairEntities.data}->>'internalDate')::bigint <= ${beforeTs}`);
            }
          }

          if (parsedQuery.from) {
            conditions.push(sql`${corsairEntities.data}->>'from' ILIKE ${`%${parsedQuery.from}%`}`);
          }
          if (parsedQuery.to) {
            conditions.push(sql`exists (
              select 1 from jsonb_array_elements(${corsairEntities.data}->'payload'->'headers') h
              where (h->>'name') ILIKE 'to' and (h->>'value') ILIKE ${`%${parsedQuery.to}%`}
            )`);
          }
          if (parsedQuery.subject) {
            conditions.push(sql`${corsairEntities.data}->>'subject' ILIKE ${`%${parsedQuery.subject}%`}`);
          }
          if (parsedQuery.terms && parsedQuery.terms.length > 0) {
            for (const term of parsedQuery.terms) {
              // Skip date-like terms that we already handled
              if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(term)) continue;
              conditions.push(sql`(
                ${corsairEntities.data}->>'subject' ILIKE ${`%${term}%`} OR
                ${corsairEntities.data}->>'snippet' ILIKE ${`%${term}%`} OR
                ${corsairEntities.data}->>'from' ILIKE ${`%${term}%`}
              )`);
            }
          }
        }

        const rows = (await db
          .select()
          .from(corsairEntities)
          .where(and(...conditions))
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
          if (offset === 0 || rows.length === limit || isCooldownActive) {
            fetchedFromGmail = true;
          }
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
          starred: ['STARRED'],
          drafts: ['DRAFT'],
          draft: ['DRAFT'],
          sent: ['SENT'],
          spam: ['SPAM'],
          trash: ['TRASH'],
          promotions: ['CATEGORY_PROMOTIONS'],
        };
        const labelIds = labelIdsMap[folder] || ['INBOX'];

        const gmailPageToken = (pageToken && !pageToken.startsWith('db_offset:')) ? pageToken : undefined;
        const hasLabelFilter = q ? /\b(in|label|is|category):/i.test(q) : false;

        // When searching (q present), search across ALL labels, not just the current folder
        const listRes = await client.gmail.api.messages.list({
          maxResults: limit,
          pageToken: gmailPageToken,
          labelIds: q ? undefined : (hasLabelFilter ? undefined : labelIds),
          q: q || undefined,
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
                  if (userId) await setGmailCooldown(userId);
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
                      data: sql`coalesce(${corsairEntities.data}, '{}'::jsonb) || ${JSON.stringify(entityData)}::jsonb`,
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
        // Mark sync time so webhooks don't re-notify for these emails
        setLastSyncTime(userId, new Date());
      } catch (gmailErr: unknown) {
        console.error('Error fetching directly from Gmail API, trying to fallback to cache:', gmailErr);
        if (is429Error(gmailErr)) {
          console.warn('[Emails GET API] Gmail API list returned 429. Setting 20-minute cooldown.');
          if (userId) await setGmailCooldown(userId);
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

            const conditions = [
              eq(corsairEntities.accountId, gmailAccount.id),
              eq(corsairEntities.entityType, 'messages'),
              sql`${corsairEntities.id} LIKE 'e_messages_%'`,
              sql`${corsairEntities.data}->'labelIds' @> ${JSON.stringify(targetLabels)}::jsonb`
            ];

            if (q) {
              conditions.push(sql`(
                ${corsairEntities.data}->>'subject' ILIKE ${`%${q}%`} OR
                ${corsairEntities.data}->>'snippet' ILIKE ${`%${q}%`} OR
                ${corsairEntities.data}->>'from' ILIKE ${`%${q}%`}
              )`);
            }

            const rows = (await db
              .select()
              .from(corsairEntities)
              .where(and(...conditions))
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

    // Fetch priority data for all emails if user is on a paid plan
    const priorityMap: Record<string, { priority: number; category: string; reason: string }> = {};
    if (userId && emails.length > 0) {
      try {
        const emailIds = emails.map((e) => e.id);
        const priorities = await db
          .select()
          .from(emailPriorities)
          .where(
            and(
              eq(emailPriorities.userId, userId),
              inArray(emailPriorities.emailId, emailIds)
            )
          );
        for (const p of priorities) {
          priorityMap[p.emailId] = { priority: p.priority, category: p.category, reason: p.reason };
        }
      } catch {
        // Priority table may not exist yet, silently ignore
      }
    }

    return NextResponse.json({
      emails: emails.map((e) => ({
        ...e,
        priority: priorityMap[e.id] || null,
      })),
      nextPageToken: apiNextPageToken,
      isDevFallback: false,
    });
  } catch (error: unknown) {
    console.error('Error in /api/emails:', error);
    if (is429Error(error)) {
      console.warn('[Emails GET API] Outer handler caught 429. Setting 20-minute cooldown.');
      if (userId) await setGmailCooldown(userId);
    }
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    if (errorMessage.includes('unauthorized_client') || errorMessage.includes('invalid_grant')) {
      errorMessage = 'Your Google connection has expired or been revoked. Please reconnect your account.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
