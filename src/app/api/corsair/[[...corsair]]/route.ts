import { toNextJsHandler } from 'corsair';
import { corsair } from '@/utils/corsair';
import logger from '@/utils/logger';
import { createClerkClient } from '@clerk/nextjs/server';
import { inngest } from '@/inngest/client';

const { GET, POST: defaultPost } = toNextJsHandler(corsair, {
  basePath: '/api/corsair',
});

export { GET };

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

      logger.info(`[Webhook POST] Dispatching async sync event to Inngest for tenant: ${activeTenantId}`);
      
      // Dispatch sync event to Inngest background queue
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

      // Immediately return 200 OK to stop Google retry storms
      return new Response(JSON.stringify({ success: true, message: 'Webhook enqueued successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
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
