import { toNextJsHandler, processWebhook } from 'corsair';
import { corsair } from '@/utils/corsair';
import logger from '@/utils/logger';
import { liveEmailsEmitter } from '@/utils/emitter';
import { createClerkClient } from '@clerk/nextjs/server';

const { GET, POST: defaultPost } = toNextJsHandler(corsair, {
  basePath: '/api/corsair',
});

export { GET };

// Map to track recently seen email IDs per tenant to avoid duplicate SSE broadcasts
const seenEmails = new Map<string, Set<string>>();

// Helper to detect 429 rate limit or quota exceeded errors
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

export async function POST(request: Request) {
  // Clone request to avoid consuming body stream if we need to fallback
  const clonedRequest = request.clone();
  let isGmailPubSub = false;
  let body: any = null;

  try {
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    body = await request.json();
    isGmailPubSub = !!(body.message && body.subscription);

    // Log incoming webhook event info
    const eventInfo = {
      messageId: body.message?.messageId,
      publishTime: body.message?.publishTime,
      subscription: body.subscription,
    };
    logger.info(`[Webhook POST] Handled event: ${JSON.stringify(eventInfo)}`);

    // Force requiring tenantId to prevent cross-tenant message processing or misrouting
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
      // Decode the payload to resolve the emailAddress
      let gmailEmail: string | null = null;
      if (body.message?.data) {
        try {
          const decoded = Buffer.from(body.message.data, 'base64').toString('utf-8');
          const parsed = JSON.parse(decoded);
          if (parsed && typeof parsed.emailAddress === 'string') {
            const emailStr = parsed.emailAddress;
            gmailEmail = emailStr;
            const [local, domain] = emailStr.split('@');
            const maskedLocal = local ? (local.length > 2 ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}` : `${local[0]}*`) : '***';
            logger.info(`[Webhook POST] Decoded Gmail email address: ${maskedLocal}@${domain || 'unknown'}`);
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
            const [local, domain] = gmailEmail.split('@');
            const maskedLocal = local ? (local.length > 2 ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}` : `${local[0]}*`) : '***';
            logger.info(`[Webhook POST] Resolved tenantId from email ${maskedLocal}@${domain || 'unknown'}: ${activeTenantId}`);
          } else {
            const [local, domain] = gmailEmail.split('@');
            const maskedLocal = local ? (local.length > 2 ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}` : `${local[0]}*`) : '***';
            logger.error(`[Webhook POST] No user found in Clerk for email: ${maskedLocal}@${domain || 'unknown'}`);
            // Acknowledge the Pub/Sub message to prevent retries for non-existent users
            return new Response(JSON.stringify({ success: true, message: 'No user found in Clerk' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (err) {
          logger.error('[Webhook POST] Clerk user lookup failed:', err);
        }
      } else {
        logger.error('[Webhook POST] Gmail Pub/Sub message did not contain a valid email address');
        return new Response(JSON.stringify({ success: true, message: 'Invalid Gmail Pub/Sub email' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (activeTenantId) {
      // Check if there is an active Gmail API 429 rate limit cooldown
      const cooldownExpiry = (global as any)._gmailCooldownExpiration;
      if (cooldownExpiry && Date.now() < cooldownExpiry) {
        const remainingSeconds = Math.ceil((cooldownExpiry - Date.now()) / 1000);
        logger.warn(`⏳ [Webhook POST] Skipping Gmail API calls for tenant ${activeTenantId} due to active 429 cooldown. Cooldown active for another ${remainingSeconds} seconds.`);
        
        return new Response(JSON.stringify({ success: true, message: 'Skipped due to active 429 cooldown' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      logger.info(`[Corsair Webhook] Attempting to process with tenantId: ${activeTenantId}`);

      // Try processing the webhook first
      let result: any = null;
      try {
        result = await processWebhook(corsair, headersObj, body, {
          tenantId: activeTenantId,
        });

        if (result && (result.success === false || result.error)) {
          if (is429Error(result)) {
            logger.warn(`[Webhook POST] processWebhook result indicates a 429 Rate Limit error. Setting 20-minute cooldown.`);
            (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
          }
        }
      } catch (err: any) {
        if (is429Error(err)) {
          logger.warn(`[Webhook POST] processWebhook threw 429 Rate Limit error. Setting 20-minute cooldown.`);
          (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
        }
        throw err;
      }

      logger.info(`[Webhook POST] processWebhook Result: ${result?.plugin ? `${result.plugin}.${result.action}` : 'skipped'}`);

      // Custom robust fallback check for new emails (bypasses Corsair's history window limits)
      const isGmailWebhook = !!body.message?.data;
      if (isGmailWebhook) {
        try {
          logger.info(`🔍 [Webhook POST] Custom Gmail sync: Yes, server is searching for messages for tenant: ${activeTenantId}`);
          const client = corsair.withTenant(activeTenantId);
          const listRes = await client.gmail.api.messages.list({
            maxResults: 3,
            labelIds: ['INBOX'],
          });

          if (listRes.messages && listRes.messages.length > 0) {
            const ids = listRes.messages.map(m => m.id).filter(Boolean) as string[];
            logger.info(`📋 [Webhook POST] Custom Gmail sync: Yes, messages found in inbox: ${JSON.stringify(ids)}`);
            
            if (!seenEmails.has(activeTenantId)) {
              // First run for this tenant: initialize the set with the current IDs without emitting them to prevent boot spam
              seenEmails.set(activeTenantId, new Set(ids));
              logger.info(`[Webhook POST] Custom Gmail sync: Initialized seen emails list for tenant ${activeTenantId}: ${JSON.stringify(ids)}`);
            } else {
              const tenantSeen = seenEmails.get(activeTenantId)!;
              for (const msg of listRes.messages) {
                if (msg.id && !tenantSeen.has(msg.id)) {
                  tenantSeen.add(msg.id);
                  // Evict older entries to keep the set bounded (limit to 50)
                  if (tenantSeen.size > 50) {
                    const firstKey = tenantSeen.keys().next().value;
                    if (firstKey !== undefined) {
                      tenantSeen.delete(firstKey);
                    }
                  }
                  liveEmailsEmitter.emit('new-email', { emailId: msg.id, tenantId: activeTenantId });
                  logger.info(`✉️ [Webhook POST] Custom Gmail sync: Emitted new email ID ${msg.id} event for tenant ${activeTenantId}`);
                }
              }
            }
          } else {
            logger.info(`⚠️ [Webhook POST] Custom Gmail sync: Yes, server searched but found NO messages in inbox.`);
          }
        } catch (err) {
          logger.error('Error in custom Gmail sync:', err);
          if (is429Error(err)) {
            logger.warn(`[Webhook POST] Custom Gmail sync returned 429 Rate Limit error. Setting 20-minute cooldown.`);
            (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
          }
        }
      }

      if (result && result.plugin) {
        logger.info(`✅ Webhook processed successfully: ${result.plugin}.${result.action}`);
        return new Response(JSON.stringify(result.response || { success: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...(result.responseHeaders || {}),
          },
        });
      }
    }

    // Acknowledge all other processed Gmail Pub/Sub webhook events to prevent Pub/Sub retry storms
    if (isGmailPubSub) {
      logger.info('[Webhook POST] Gmail Pub/Sub webhook processing complete, acknowledging with 200 OK');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    logger.error('Error parsing or processing webhook payload:', error);
    if (is429Error(error)) {
      logger.warn(`[Webhook POST] Outer handler caught 429 Rate Limit error. Setting 20-minute cooldown.`);
      (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
    }
    if (isGmailPubSub) {
      logger.info('[Webhook POST] Error occurred during Gmail Pub/Sub processing, acknowledging with 200 OK to stop retries');
      return new Response(JSON.stringify({ success: true, warning: 'Error during processing' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Fallback to default Corsair management handler with the cloned unconsumed request
  return defaultPost(clonedRequest);
}
