import { toNextJsHandler, processWebhook } from 'corsair';
import { corsair, db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { CorsairPlaceholder } from './_types';
import { sendLogOnTelegram } from '@/utils/LiveTestLogOnTelegram';
import { liveEmailsEmitter } from '@/utils/emitter';

const { GET, POST: defaultPost } = toNextJsHandler(corsair, {
  basePath: '/api/corsair',
});

export { GET };

export async function POST(request: Request) {
  // Clone request to avoid consuming body stream if we need to fallback
  const clonedRequest = request.clone();

  try {
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    const body = await request.json();

    // Log incoming payload to Telegram
    try {
      await sendLogOnTelegram(`[Webhook POST] Payload: ${JSON.stringify(body)}`);
    } catch (e) {
      console.error('Failed to log on telegram from webhook route:', e);
    }

    // Check query params for tenantId, or query the database for the active gmail tenant
    const url = new URL(request.url);
    let activeTenantId = url.searchParams.get('tenantId') || undefined;

    if (!activeTenantId) {
      try {
        const gmailIntegration = await db
          .select()
          .from(corsairIntegrations)
          .where(eq(corsairIntegrations.name, 'gmail'))
          .limit(1);

        if (gmailIntegration.length > 0) {
          const userAccounts = await db
            .select()
            .from(corsairAccounts)
            .where(
              and(
                eq(corsairAccounts.integrationId, gmailIntegration[0].id),
                ne(corsairAccounts.tenantId, 'dev')
              )
            )
            .limit(1);
          
          if (userAccounts.length > 0) {
            activeTenantId = userAccounts[0].tenantId;
          } else {
            const fallbackAccounts = await db
              .select()
              .from(corsairAccounts)
              .where(eq(corsairAccounts.integrationId, gmailIntegration[0].id))
              .limit(1);
            if (fallbackAccounts.length > 0) {
              activeTenantId = fallbackAccounts[0].tenantId;
            }
          }
        }
      } catch (err) {
        console.error('Error finding tenant for webhook:', err);
        try {
          await sendLogOnTelegram(`[Webhook POST] Error finding tenant: ${err instanceof Error ? err.message : String(err)}`);
        } catch (e) {}
      }
    }

    console.log(`[Corsair Webhook] Attempting to process with tenantId: ${activeTenantId || 'default'}`);
    try {
      await sendLogOnTelegram(`[Webhook POST] Attempting process with tenantId: ${activeTenantId || 'default'}`);
    } catch (e) {}

    // Try processing the webhook first
    const result = await processWebhook(corsair, headersObj, body, {
      tenantId: activeTenantId || 'default',
    });

    try {
      await sendLogOnTelegram(`[Webhook POST] processWebhook Result: ${JSON.stringify(result)}`);
    } catch (e) {}

    // Custom robust fallback check for new emails (bypasses Corsair's history window limits)
    const isGmailWebhook = !!body.message?.data;
    if (isGmailWebhook && activeTenantId) {
      try {
        await sendLogOnTelegram(`🔍 [Webhook POST] Custom Gmail sync: Yes, server is searching for messages for tenant: ${activeTenantId}`);
        const client = corsair.withTenant(activeTenantId);
        const listRes = await client.gmail.api.messages.list({
          maxResults: 3,
          labelIds: ['INBOX'],
        });
        if (listRes.messages && listRes.messages.length > 0) {
          const ids = listRes.messages.map(m => m.id).filter(Boolean);
          await sendLogOnTelegram(`📋 [Webhook POST] Custom Gmail sync: Yes, messages found in inbox: ${JSON.stringify(ids)}`);
          for (const msg of listRes.messages) {
            if (msg.id) {
              liveEmailsEmitter.emit('new-email', { emailId: msg.id });
              await sendLogOnTelegram(`✉️ [Webhook POST] Custom Gmail sync: Yes, server sent message ID ${msg.id} event to client emitter`);
            }
          }
        } else {
          await sendLogOnTelegram(`⚠️ [Webhook POST] Custom Gmail sync: Yes, server searched but found NO messages in inbox.`);
        }
      } catch (err) {
        console.error('Error in custom Gmail sync:', err);
        await sendLogOnTelegram(`❌ [Webhook POST] Custom Gmail sync error during search: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (result.plugin) {
      console.log(`✅ Webhook processed successfully: ${result.plugin}.${result.action}`);
      return new Response(JSON.stringify(result.response || { success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...(result.responseHeaders || {}),
        },
      });
    }
  } catch (error) {
    console.error('Error parsing or processing webhook payload:', error);
    try {
      await sendLogOnTelegram(`[Webhook POST] Exception: ${error instanceof Error ? error.message : String(error)}`);
    } catch (e) {}
  }

  // Fallback to default Corsair management handler with the cloned unconsumed request
  return defaultPost(clonedRequest);
}
