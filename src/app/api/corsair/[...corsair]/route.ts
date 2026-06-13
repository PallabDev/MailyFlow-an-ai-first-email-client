import { toNextJsHandler, processWebhook } from 'corsair';
import { corsair, db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { CorsairPlaceholder } from './_types';

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
      }
    }

    console.log(`[Corsair Webhook] Attempting to process with tenantId: ${activeTenantId || 'default'}`);

    // Try processing the webhook first
    const result = await processWebhook(corsair, headersObj, body, {
      tenantId: activeTenantId || 'default',
    });

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
  }

  // Fallback to default Corsair management handler with the cloned unconsumed request
  return defaultPost(clonedRequest);
}
