import { toNextJsHandler } from 'corsair';
import { corsair } from '@/lib/corsair';
import logger from '@/lib/logger';
import { createClerkClient } from '@clerk/nextjs/server';
import { inngest } from '@/server/inngest/client';
import { db } from '@/lib/corsair';
import { webhookDedup } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

const { GET, POST: defaultPost } = toNextJsHandler(corsair, {
  basePath: '/api/corsair',
});

export { GET };

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

const PUBSUB_DEDUP_PREFIX = 'pubsub:';

export async function POST(request: Request) {
  const clonedRequest = request.clone();
  let isGmailPubSub = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = null;

  try {
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    const rawBody = await request.text();
    if (!rawBody || rawBody.trim().length === 0) {
      if (isGmailPubSub) {
        return new Response(JSON.stringify({ success: true, message: 'Empty body' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return defaultPost(clonedRequest);
    }
    body = JSON.parse(rawBody);
    isGmailPubSub = !!(body.message && body.subscription);

    // DB-backed Pub/Sub message dedup
    if (isGmailPubSub && body.message?.messageId) {
      const dedupId = `${PUBSUB_DEDUP_PREFIX}${body.message.messageId}`;
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

      const existing = await db
        .select({ messageId: webhookDedup.messageId })
        .from(webhookDedup)
        .where(
          and(
            eq(webhookDedup.tenantId, '__pubsub__'),
            eq(webhookDedup.messageId, dedupId),
            sql`${webhookDedup.seenAt} > ${fiveMinAgo}`
          )
        )
        .limit(1);

      if (existing.length > 0) {
        logger.info(`[Webhook POST] Skipping duplicate Pub/Sub message: ${body.message.messageId}`);
        return new Response(JSON.stringify({ success: true, message: 'Duplicate skipped' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Mark as seen
      await db
        .insert(webhookDedup)
        .values({
          tenantId: '__pubsub__',
          messageId: dedupId,
          seenAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [webhookDedup.tenantId, webhookDedup.messageId],
          set: { seenAt: new Date() },
        });
    }

    const eventInfo = {
      messageId: body.message?.messageId,
      publishTime: body.message?.publishTime,
      subscription: body.subscription,
    };
    logger.info(`[Webhook POST] Handled event: ${JSON.stringify(eventInfo)}`);

    const url = new URL(request.url);
    let activeTenantId = url.searchParams.get('tenantId');

    if (!activeTenantId && !isGmailPubSub) {
      logger.error('[Webhook POST] Webhook rejected: Missing tenantId in query parameters.');
      return new Response(JSON.stringify({ error: 'Missing tenantId query parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!activeTenantId && isGmailPubSub) {
      let gmailEmail: string | null = null;
      if (body.message?.data) {
        try {
          const decoded = Buffer.from(body.message.data, 'base64').toString('utf-8');
          const parsed = JSON.parse(decoded);
          if (parsed && typeof parsed.emailAddress === 'string') {
            gmailEmail = parsed.emailAddress;
          }
        } catch (err) {
          logger.error('[Webhook POST] Failed to parse Gmail Pub/Sub message data:', err);
        }
      }

      if (gmailEmail) {
        try {
          const clerkClient = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY,
          });
          const response = await clerkClient.users.getUserList({
            emailAddress: [gmailEmail],
          });
          const user = response.data[0];
          if (user) {
            activeTenantId = user.id;
          } else {
            return new Response(JSON.stringify({ success: true, message: 'No user found in Clerk' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (err) {
          logger.error('[Webhook POST] Clerk user lookup failed:', err);
        }
      } else {
        return new Response(JSON.stringify({ success: true, message: 'Invalid Gmail Pub/Sub email' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (activeTenantId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cooldownExpiry = (global as any)._gmailCooldownExpiration;
      if (cooldownExpiry && Date.now() < cooldownExpiry) {
        const remainingSeconds = Math.ceil((cooldownExpiry - Date.now()) / 1000);
        logger.warn(`⏳ [Webhook POST] Skipping for tenant ${activeTenantId} due to 429 cooldown. Remaining: ${remainingSeconds}s.`);
        return new Response(JSON.stringify({ success: true, message: 'Skipped due to 429 cooldown' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      logger.info(`[Webhook POST] Dispatching async sync event to Inngest for tenant: ${activeTenantId}`);

      try {
        await inngest.send({
          name: 'gmail.webhook.received',
          data: {
            headersObj,
            body,
            activeTenantId
          }
        });
      } catch (inngestErr) {
        logger.error('[Webhook POST] Failed to dispatch Inngest event:', inngestErr);
      }

      return new Response(JSON.stringify({ success: true, message: 'Webhook enqueued' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (isGmailPubSub) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    logger.error('Error parsing or processing webhook payload:', error);
    if (is429Error(error)) {
      logger.warn(`[Webhook POST] Outer handler caught 429. Setting 20-minute cooldown.`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
    }
    if (isGmailPubSub) {
      return new Response(JSON.stringify({ success: true, warning: 'Error during processing' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return defaultPost(clonedRequest);
}
