import { inngest } from './client';
import { db, corsair, hasActiveConnection } from '@/utils/corsair';
import { chatMessages, userSubscriptions } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { openai, AI_MODEL } from '@/utils/openai';
import { getSystemInstruction } from '@/system/ai_system';
import { OpenAIAgentsProvider } from '@corsair-dev/mcp';
import { Agent, run, tool, OpenAIProvider, setDefaultModelProvider } from '@openai/agents';
import { processWebhook } from 'corsair';
import { liveEmailsEmitter } from '@/utils/emitter';

export const processAICall = inngest.createFunction(
  {
    id: 'process-ai-call',
    name: 'Process AI Call',
    // Minimum 2 retries in case of failures (3 attempts total)
    retries: 2,
    triggers: [{ event: 'chat.message.sent' }],
  },
  async ({ event, step }) => {
    const {
      userId,
      userFirstName,
      userLastName,
      userEmail,
      hasGmailConnection,
      hasCalendarConnection,
      messages,
      timezone,
      localTime,
      assistantMessageId,
    } = event.data;

    // Run the OpenAI agent execution step
    const resultText = await step.run('openai-agent-run', async () => {
      // Helper function to check if cancelled
      const checkCancelled = async () => {
        try {
          const existing = await db
            .select({ status: chatMessages.status })
            .from(chatMessages)
            .where(eq(chatMessages.id, assistantMessageId))
            .limit(1);
          return existing.length > 0 && existing[0].status === 'cancelled';
        } catch (err) {
          console.error('Failed to check cancel status:', err);
          return false;
        }
      };

      if (await checkCancelled()) {
        return '__CANCELLED__';
      }

      // Configure the OpenAI provider for agents
      const openaiProvider = new OpenAIProvider({
        openAIClient: openai,
      });
      setDefaultModelProvider(openaiProvider);

      // Build the dynamic Corsair MCP tools array
      const provider = new OpenAIAgentsProvider();
      const tools = provider.build({
        corsair: corsair.withTenant(userId),
        tool,
        tenantId: userId,
        setup: false,
      });

      // Clean up $schema from parameters to prevent validation/compatibility issues
      for (const t of tools) {
        const toolObj = t as any;
        if (toolObj.parameters && typeof toolObj.parameters === 'object' && '$schema' in toolObj.parameters) {
          delete toolObj.parameters.$schema;
        }
      }

      // Fetch user subscription plan from DB
      let userPlan: 'Starter' | 'Professional' | 'Business' = 'Starter';
      try {
        const [sub] = await db
          .select({ planName: userSubscriptions.planName })
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, userId))
          .limit(1);
        if (sub?.planName) {
          userPlan = sub.planName as 'Starter' | 'Professional' | 'Business';
        }
      } catch (dbErr) {
        console.error('Failed to load user plan, defaulting to Starter:', dbErr);
      }

      // Build system instructions using system promts helper
      const systemInstruction = getSystemInstruction({
        projectName: process.env.ProjectName || 'MailyFlow',
        userLocalTime: localTime || new Date().toISOString(),
        userTimezone: timezone || 'UTC',
        userName: `${userFirstName || 'Unknown'} ${userLastName || ''}`.trim(),
        userEmail: userEmail || 'Unknown',
        hasGmailConnection,
        hasCalendarConnection,
        userPlan,
      });

      const agent = new Agent({
        name: 'corsair-agent',
        model: AI_MODEL,
        instructions: systemInstruction,
        tools,
      });

      // Load last 20 completed chat messages from the database for persistent AI memory context
      let dbHistory: any[] = [];
      try {
        const dbHistoryDesc = await db
          .select({
            role: chatMessages.role,
            content: chatMessages.content,
          })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.userId, userId),
              eq(chatMessages.status, 'completed')
            )
          )
          .orderBy(desc(chatMessages.createdAt))
          .limit(20);

        dbHistory = [...dbHistoryDesc].reverse();
      } catch (dbErr) {
        console.error('Failed to load chat history from DB, running with single prompt context:', dbErr);
        // Fallback to the latest user message in history
        const latestUserMsg = messages && messages.length > 0 ? messages[messages.length - 1] : { role: 'user', content: 'Hello' };
        dbHistory = [latestUserMsg];
      }

      const formatHistoryMessages = (msgs: any[]) => {
        return msgs.map((m: any) => {
          if (m.role === 'assistant' && typeof m.content === 'string') {
            return {
              role: 'assistant',
              content: [{ type: 'output_text', text: m.content }],
            };
          }
          return {
            role: m.role,
            content: m.content,
          };
        });
      };

      if (await checkCancelled()) {
        return '__CANCELLED__';
      }

      let completed = false;
      const progressMessages = [
        '🔍 Analyzing your request and workspace context...',
        '📬 Accessing Gmail accounts and sync records...',
        '⚙️ Querying database schedules and tool definitions...',
        '✍️ Drafting message response or organizing outcomes...',
        '🧠 Refining response layout and wrapping up...'
      ];

      const progressInterval = setInterval(async () => {
        if (completed) {
          clearInterval(progressInterval);
          return;
        }
        const currentProgress = progressMessages.shift();
        if (currentProgress) {
          try {
            await db
              .update(chatMessages)
              .set({
                content: currentProgress,
                updatedAt: new Date(),
              })
              .where(eq(chatMessages.id, assistantMessageId));
          } catch (err) {
            console.error('Failed to update progress status:', err);
          }
        } else {
          clearInterval(progressInterval);
        }
      }, 4500);

      try {
        const result = await run(agent, formatHistoryMessages(dbHistory));
        completed = true;
        clearInterval(progressInterval);

        if (await checkCancelled()) {
          return '__CANCELLED__';
        }

        let outputText = result.finalOutput || '';

        // Strip any leaked function/tool call tags
        outputText = outputText.replace(/<(function|run_script|tool|tool_call)[^>]*>[\s\S]*?<\/\1>/gi, '');
        outputText = outputText.replace(/<function\/(run_script|tool_call)[^>]*>[\s\S]*?<\/function\/\1>/gi, '');
        outputText = outputText.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/gi, (match) => {
          const lower = match.toLowerCase();
          if (
            lower.includes('function') ||
            lower.includes('script') ||
            lower.includes('tool') ||
            lower.includes('code') ||
            lower.includes('auth')
          ) {
            return '';
          }
          return match;
        });
        return outputText.trim();
      } catch (runErr) {
        completed = true;
        clearInterval(progressInterval);
        throw runErr;
      }
    });

    // Save output to the DB if the message has not been cancelled by the user
    await step.run('save-to-db', async () => {
      if (resultText === '__CANCELLED__') {
        return;
      }
      try {
        // Fetch current status to check if cancelled
        const existing = await db
          .select({ status: chatMessages.status })
          .from(chatMessages)
          .where(eq(chatMessages.id, assistantMessageId))
          .limit(1);

        if (existing.length > 0 && existing[0].status === 'cancelled') {
          // Request was cancelled by user, do not overwrite status
          return;
        }

        await db
          .update(chatMessages)
          .set({
            content: resultText,
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(chatMessages.id, assistantMessageId));
      } catch (dbErr) {
        console.error('Failed to update assistant message in DB:', dbErr);
      }
    });

    return { success: true };
  }
);

// Listen for errors to log/track workflow failure states
export const trackFailedAICalls = inngest.createFunction(
  {
    id: 'track-failed-ai-calls',
    name: 'Track Failed AI Calls',
    triggers: [{ event: 'inngest/function.failed' }],
  },
  async ({ event, step }) => {
    const errorPayload = event.data;
    console.error('Inngest function processing failed:', errorPayload);
    
    // Attempt to parse out assistantMessageId and set its status to failed
    const funcEvent = errorPayload.event;
    if (funcEvent && funcEvent.name === 'chat.message.sent' && funcEvent.data?.assistantMessageId) {
      await step.run('mark-db-failed', async () => {
        try {
          await db
            .update(chatMessages)
            .set({
              status: 'failed',
              content: '⚠️ Failed to generate AI response. Please try again.',
              updatedAt: new Date(),
            })
            .where(eq(chatMessages.id, funcEvent.data.assistantMessageId));
        } catch (dbErr) {
          console.error('Failed to update status to failed in DB:', dbErr);
        }
      });
    }
  }
);

// Map to track recently seen email IDs per tenant to avoid duplicate SSE broadcasts
const seenEmails = new Map<string, Set<string>>();

const isGmail429Error = (err: any): boolean => {
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

export const syncGmailWebhook = inngest.createFunction(
  {
    id: 'sync-gmail-webhook',
    name: 'Sync Gmail Webhook',
    concurrency: {
      limit: 1,
      key: 'event.data.activeTenantId',
    },
    triggers: [{ event: 'gmail.webhook.received' }],
  },
  async ({ event, step }) => {
    const { headersObj, body, activeTenantId } = event.data;

    // Check if there is an active Gmail API 429 rate limit cooldown
    const cooldownExpiry = (global as any)._gmailCooldownExpiration;
    if (cooldownExpiry && Date.now() < cooldownExpiry) {
      const remainingSeconds = Math.ceil((cooldownExpiry - Date.now()) / 1000);
      console.warn(`⏳ [Inngest Sync] Skipping sync for tenant ${activeTenantId} due to active 429 cooldown. Remaining: ${remainingSeconds}s.`);
      return { skipped: true, reason: 'active 429 cooldown' };
    }

    // 1. Run processWebhook
    let result: any = null;
    try {
      result = await step.run('run-process-webhook', async () => {
        const res = await processWebhook(corsair, headersObj, body, {
          tenantId: activeTenantId,
        });
        return res;
      });
    } catch (err: any) {
      const errMsg = String(err.message || err).toLowerCase();
      if (errMsg.includes('account not found') || errMsg.includes('make sure to create the account first')) {
        console.warn(`⚠️ [Inngest Sync] Account not found for tenant ${activeTenantId}. User may have disconnected Gmail. Skipping.`);
        return { success: false, skipped: true, reason: 'account_not_found' };
      }
      if (isGmail429Error(err)) {
        console.warn(`[Inngest Sync] processWebhook threw 429. Setting 20-minute cooldown.`);
        (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
      }
      throw err;
    }

    // 2. Custom robust fallback sync
    const isGmailWebhook = !!body.message?.data;
    if (isGmailWebhook) {
      try {
        await step.run('run-custom-sync', async () => {
          // Check Gmail connection first to prevent "Account not found" crashes
          const gmailConnected = await hasActiveConnection(activeTenantId, 'gmail');
          if (!gmailConnected) {
            console.warn(`⚠️ [Inngest Sync] No active Gmail connection for tenant ${activeTenantId}. Skipping custom sync.`);
            return;
          }

          const client = corsair.withTenant(activeTenantId);
          const listRes = await client.gmail.api.messages.list({
            maxResults: 3,
            labelIds: ['INBOX'],
          });

          if (listRes.messages && listRes.messages.length > 0) {
            const ids = listRes.messages.map(m => m.id).filter(Boolean) as string[];
            
            if (!seenEmails.has(activeTenantId)) {
              seenEmails.set(activeTenantId, new Set(ids));
            } else {
              const tenantSeen = seenEmails.get(activeTenantId)!;
              for (const msg of listRes.messages) {
                if (msg.id && !tenantSeen.has(msg.id)) {
                  tenantSeen.add(msg.id);
                  if (tenantSeen.size > 50) {
                    const firstKey = tenantSeen.keys().next().value;
                    if (firstKey !== undefined) {
                      tenantSeen.delete(firstKey);
                    }
                  }
                  // 1. Emit locally for immediate response
                  liveEmailsEmitter.emit('new-email', { emailId: msg.id, tenantId: activeTenantId });
                  console.log(`✉️ [Inngest Sync] Emitted new email ID ${msg.id} event for tenant ${activeTenantId}`);

                  // 2. Publish to Postgres NOTIFY to sync across instances
                  try {
                    const payload = JSON.stringify({ emailId: msg.id, tenantId: activeTenantId });
                    await db.execute(sql`SELECT pg_notify('new_email', ${payload})`);
                    console.log(`🔊 [Inngest Sync] Published pg_notify for new email event`);
                  } catch (pgErr) {
                    console.error('[Inngest Sync] Failed to publish pg_notify:', pgErr);
                  }
                }
              }
            }
          }
        });
      } catch (err) {
        console.error('Error in custom Gmail sync inside Inngest:', err);
        if (isGmail429Error(err)) {
          console.warn(`[Inngest Sync] Custom sync returned 429. Setting 20-minute cooldown.`);
          (global as any)._gmailCooldownExpiration = Date.now() + 20 * 60 * 1000;
        }
      }
    }

    return { success: true, result };
  }
);

