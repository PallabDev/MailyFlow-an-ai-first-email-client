import { inngest } from './client';
import { db, corsair, hasActiveConnection } from '@/utils/corsair';
import { chatMessages, userSubscriptions, corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { openai, AI_MODEL } from '@/utils/openai';
import { getSystemInstruction } from '@/system/ai_system';
import { OpenAIAgentsProvider } from '@corsair-dev/mcp';
import { Agent, run, tool, OpenAIProvider, setDefaultModelProvider } from '@openai/agents';
import { processWebhook } from 'corsair';
import { publishNewEmailEvent } from '@/utils/publish-new-email';
import { getGmailCooldownExpiration, setGmailCooldown } from '@/utils/cooldown';
import { getSocketIO } from '@/lib/socket-server';

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
        const toolObj = t as { parameters?: Record<string, unknown> };
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
      let dbHistory: { role: string; content: string }[] = [];
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
        const latestUserMsg = messages && messages.length > 0 ? (messages[messages.length - 1] as { role: string; content: string }) : { role: 'user', content: 'Hello' };
        dbHistory = [latestUserMsg];
      }

      const formatHistoryMessages = (msgs: { role: string; content: string }[]) => {
        return msgs.map((m: { role: string; content: string }) => {
          if (m.role === 'assistant') {
            return {
              role: 'assistant' as const,
              status: 'completed' as const,
              content: [{ type: 'output_text' as const, text: m.content || '' }],
            };
          }
          if (m.role === 'system') {
            return {
              role: 'system' as const,
              content: m.content,
            };
          }
          return {
            role: 'user' as const,
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
const isGmail429Error = (err: unknown): boolean => {
  if (!err) return false;
  const errObj = err as Record<string, unknown>;
  const errMsg = String(errObj.message || errObj.error || err).toLowerCase();
  
  const bodyError = errObj.body && typeof errObj.body === 'object' && 'error' in errObj.body && errObj.body.error && typeof errObj.body.error === 'object' && 'code' in errObj.body.error
    ? (errObj.body.error as Record<string, unknown>).code
    : null;

  return (
    errObj.status === 429 ||
    errObj.statusCode === 429 ||
    bodyError === 429 ||
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
    const cooldownExpiry = await getGmailCooldownExpiration(activeTenantId);
    if (cooldownExpiry && Date.now() < cooldownExpiry) {
      const remainingSeconds = Math.ceil((cooldownExpiry - Date.now()) / 1000);
      console.warn(`⏳ [Inngest Sync] Skipping sync for tenant ${activeTenantId} due to active 429 cooldown. Remaining: ${remainingSeconds}s.`);
      return { skipped: true, reason: 'active 429 cooldown' };
    }

    // 1. Run processWebhook
    let result: unknown = null;
    const syncStartedAtStr = await step.run('get-sync-start-time', () => new Date().toISOString());
    const syncStartedAt = new Date(syncStartedAtStr);
    try {
      result = await step.run('run-process-webhook', async () => {
        const res = await processWebhook(corsair, headersObj, body, {
          tenantId: activeTenantId,
        });
        return res;
      });
    } catch (err) {
      const errObj = err as Record<string, unknown>;
      const errMsg = String(errObj?.message || err).toLowerCase();
      if (errMsg.includes('account not found') || errMsg.includes('make sure to create the account first')) {
        console.warn(`⚠️ [Inngest Sync] Account not found for tenant ${activeTenantId}. User may have disconnected Gmail. Skipping.`);
        return { success: false, skipped: true, reason: 'account_not_found' };
      }
      if (isGmail429Error(err)) {
        console.warn(`[Inngest Sync] processWebhook threw 429. Setting 20-minute cooldown.`);
        await setGmailCooldown(activeTenantId);
      }
      throw err;
    }

    // 2. Publish Socket.IO events for messages synced during processWebhook
    await step.run('publish-realtime-events', async () => {
      const gmailAccount = await db
        .select({ id: corsairAccounts.id })
        .from(corsairAccounts)
        .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
        .where(
          and(
            eq(corsairAccounts.tenantId, activeTenantId),
            eq(corsairIntegrations.name, 'gmail')
          )
        )
        .limit(1)
        .then((rows) => rows[0]);

      if (!gmailAccount) {
        console.warn(`⚠️ [Inngest Sync] No Gmail account for tenant ${activeTenantId}. Skipping realtime publish.`);
        return;
      }

      const syncedEntities = await db
        .select({ data: corsairEntities.data })
        .from(corsairEntities)
        .where(
          and(
            eq(corsairEntities.accountId, gmailAccount.id),
            eq(corsairEntities.entityType, 'messages'),
            gte(corsairEntities.updatedAt, syncStartedAt)
          )
        );

      const publishedIds = new Set<string>();
      for (const row of syncedEntities) {
        const msg = row.data as { id?: string; labelIds?: string[] };
        if (!msg.id || publishedIds.has(msg.id)) continue;

        const labels = msg.labelIds ?? [];
        if (labels.length > 0 && !labels.includes('INBOX')) continue;

        publishedIds.add(msg.id);
        await publishNewEmailEvent(msg.id, activeTenantId);
        console.log(`✉️ [Inngest Sync] Published realtime event for email ${msg.id}, tenant ${activeTenantId}`);
      }
    });

    // 3. Fallback: list inbox and notify for messages not yet in DB cache
    const isGmailWebhook = !!body.message?.data;
    if (isGmailWebhook) {
      try {
        await step.run('run-custom-sync', async () => {
          const gmailConnected = await hasActiveConnection(activeTenantId, 'gmail');
          if (!gmailConnected) {
            console.warn(`⚠️ [Inngest Sync] No active Gmail connection for tenant ${activeTenantId}. Skipping custom sync.`);
            return;
          }

          const gmailAccount = await db
            .select({ id: corsairAccounts.id })
            .from(corsairAccounts)
            .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
            .where(
              and(
                eq(corsairAccounts.tenantId, activeTenantId),
                eq(corsairIntegrations.name, 'gmail')
              )
            )
            .limit(1)
            .then((rows) => rows[0]);

          if (!gmailAccount) return;

          const cachedRows = await db
            .select({ entityId: corsairEntities.entityId })
            .from(corsairEntities)
            .where(
              and(
                eq(corsairEntities.accountId, gmailAccount.id),
                eq(corsairEntities.entityType, 'messages')
              )
            );

          const cachedIds = new Set(cachedRows.map((r) => r.entityId));

          const client = corsair.withTenant(activeTenantId);
          const listRes = await client.gmail.api.messages.list({
            maxResults: 5,
            labelIds: ['INBOX'],
          });

          if (!listRes.messages?.length) return;

          for (const msg of listRes.messages) {
            if (msg.id && !cachedIds.has(msg.id)) {
              await publishNewEmailEvent(msg.id, activeTenantId);
              console.log(`✉️ [Inngest Sync] Fallback published realtime event for email ${msg.id}`);
            }
          }
        });
      } catch (err) {
        console.error('Error in custom Gmail sync inside Inngest:', err);
        if (isGmail429Error(err)) {
          console.warn(`[Inngest Sync] Custom sync returned 429. Setting 20-minute cooldown.`);
          await setGmailCooldown(activeTenantId);
        }
      }
    }

    // 4. Background Sync for Label Counts
    try {
      await step.run('sync-label-counts', async () => {
        const gmailConnected = await hasActiveConnection(activeTenantId, 'gmail');
        if (!gmailConnected) return;

        const gmailAccount = await db
          .select({ id: corsairAccounts.id })
          .from(corsairAccounts)
          .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
          .where(
            and(
              eq(corsairAccounts.tenantId, activeTenantId),
              eq(corsairIntegrations.name, 'gmail')
            )
          )
          .limit(1)
          .then((rows) => rows[0]);

        if (!gmailAccount) return;

        const client = corsair.withTenant(activeTenantId);
        const [inbox, drafts, spam] = await Promise.all([
          client.gmail.api.labels.get({ id: 'INBOX' }).catch(() => null),
          client.gmail.api.labels.get({ id: 'DRAFT' }).catch(() => null),
          client.gmail.api.labels.get({ id: 'SPAM' }).catch(() => null),
        ]);

        const labelsToSave = [
          { id: 'INBOX', data: { messagesUnread: inbox?.messagesUnread ?? 0, messagesTotal: inbox?.messagesTotal ?? 0 } },
          { id: 'DRAFT', data: { messagesTotal: drafts?.messagesTotal ?? 0 } },
          { id: 'SPAM', data: { messagesTotal: spam?.messagesTotal ?? 0 } }
        ];

        for (const label of labelsToSave) {
          await db
            .insert(corsairEntities)
            .values({
              id: `e_labels_${label.id}_a_${gmailAccount.id}`,
              accountId: gmailAccount.id,
              entityId: label.id,
              entityType: 'labels',
              version: '1',
              data: label.data,
            })
            .onConflictDoUpdate({
              target: corsairEntities.id,
              set: {
                data: label.data,
                updatedAt: new Date()
              }
            });
        }
      });
    } catch (err) {
      console.error('Error in background label sync inside Inngest:', err);
      if (isGmail429Error(err)) {
        await setGmailCooldown(activeTenantId);
      }
    }

    return { success: true, result };
  }
);

export const summarizeEmail = inngest.createFunction(
  {
    id: 'summarize-email',
    name: 'Summarize Email',
    triggers: [{ event: 'email.summarize.requested' }],
  },
  async ({ event, step }) => {
    const { userId, emailId } = event.data;

    try {
      const summaryText = await step.run('generate-summary', async () => {
        const client = corsair.withTenant(userId);
        
        // Fetch message details
        const message = await client.gmail.api.messages.get({
          id: emailId,
        });

        // Resolve snippet or body text
        const snippet = message.snippet || '';
        let bodyText = snippet;

        // Try to get body text if available in payload
        if (message.payload) {
          const parts = message.payload.parts || [];
          const textPart = parts.find((p: any) => p.mimeType === 'text/plain');
          if (textPart && textPart.body?.data) {
            bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
          } else if (message.payload.body?.data) {
            bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
          }
        }

        // Construct context-rich OpenAI summary prompt
        const prompt = `You are a professional email executive. Please summarize the following email in a brief, clear, and high-impact format (3-4 bullet points maximum). Avoid any greetings, introductions, or sign-offs. Focus strictly on key takeaways and any action items.

Sender: ${message.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown'}
Subject: ${message.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(No Subject)'}
Content: ${bodyText.slice(0, 4000)}`;

        const response = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
        });

        return response.choices[0].message.content || 'Failed to generate summary.';
      });

      // Emit summary ready socket event
      await step.run('broadcast-summary', async () => {
        const io = getSocketIO();
        if (io) {
          io.to(`user:${userId}`).emit('email-summary-ready', {
            emailId,
            summary: summaryText,
          });
          console.log(`[Inngest Summarize] Emitted summary for email ${emailId} to user:${userId}`);
        } else {
          console.warn('[Inngest Summarize] Socket.IO server not initialized, could not emit summary.');
        }
      });

      return { success: true };
    } catch (err) {
      console.error('Error in Inngest email summary workflow:', err);
      // Emit failure event
      const io = getSocketIO();
      if (io) {
        io.to(`user:${userId}`).emit('email-summary-failed', {
          emailId,
          error: err instanceof Error ? err.message : 'Failed to generate summary.',
        });
      }
      throw err;
    }
  }
);

