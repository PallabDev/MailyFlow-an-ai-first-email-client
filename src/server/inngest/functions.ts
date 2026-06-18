import { inngest } from './client';
import { db, corsair, hasActiveConnection } from '@/lib/corsair/utils';
import { chatMessages, userSubscriptions, corsairAccounts, corsairIntegrations, corsairEntities, emailPriorities } from '@/server/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { openai, AI_MODEL } from '@/lib/openai/client';
import { getSystemInstruction } from '@/features/ai/services/ai_system';
import { OpenAIAgentsProvider } from '@corsair-dev/mcp';
import { Agent, run, tool, OpenAIProvider, setDefaultModelProvider } from '@openai/agents';
import { processWebhook } from 'corsair';
import { publishNewEmailEvent } from '@/lib/publish-new-email';
import { getGmailCooldownExpiration, setGmailCooldown } from '@/lib/cooldown';
import { getSocketIO } from '@/lib/socket/server';
import logger from '@/lib/logger';
import { shouldPublishEvent, setLastSyncTime } from '@/lib/webhook-dedup';

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
                        logger.error('Failed to check cancel status:', err);
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
                logger.error('Failed to load user plan, defaulting to Starter:', dbErr);
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
                logger.error('Failed to load chat history from DB:', dbErr);
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
                        logger.error('Failed to update progress status:', err);
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
                logger.error('Failed to update assistant message in DB:', dbErr);
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
        logger.error('Inngest function processing failed:', errorPayload);

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
                    logger.error('Failed to update status to failed in DB:', dbErr);
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
            logger.warn(`⏳ [Inngest Sync] Skipping sync for tenant ${activeTenantId} due to active 429 cooldown. Remaining: ${remainingSeconds}s.`);
            return { skipped: true, reason: 'active 429 cooldown' };
        }

        // 1. Run processWebhook — this is the only Gmail API call we allow per webhook
        let result: unknown = null;
        const syncStartedAtStr = await step.run('get-sync-start-time', () => new Date().toISOString());
        const syncStartedAt = new Date(syncStartedAtStr);

        // Update last sync time for dedup tracking
        await setLastSyncTime(activeTenantId, syncStartedAt);

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
                logger.warn(`⚠️ [Inngest Sync] Account not found for tenant ${activeTenantId}. Skipping.`);
                return { success: false, skipped: true, reason: 'account_not_found' };
            }
            if (isGmail429Error(err)) {
                logger.warn(`[Inngest Sync] processWebhook threw 429. Setting 20-minute cooldown.`);
                await setGmailCooldown(activeTenantId);
            }
            throw err;
        }

        // 2. Publish Socket.IO events for messages synced during processWebhook
        //    Only send classification events for paid users (avoid wasted Inngest triggers)
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
                logger.warn(`⚠️ [Inngest Sync] No Gmail account for tenant ${activeTenantId}. Skipping.`);
                return;
            }

            // Query recent entities (last 30 min) without relying on updatedAt filter.
            // shouldPublishEvent handles dedup via the webhook_dedup table.
            const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
            const syncedEntities = await db
                .select({ data: corsairEntities.data })
                .from(corsairEntities)
                .where(
                    and(
                        eq(corsairEntities.accountId, gmailAccount.id),
                        eq(corsairEntities.entityType, 'messages'),
                        sql`${corsairEntities.createdAt} >= ${thirtyMinAgo}`
                    )
                );

            logger.info(`[Inngest Sync] Found ${syncedEntities.length} recent entities for tenant ${activeTenantId}`);

            // Check if user is on paid plan (once, not per email)
            let isPaidUser = false;
            try {
                const [sub] = await db
                    .select({ planName: userSubscriptions.planName, status: userSubscriptions.status })
                    .from(userSubscriptions)
                    .where(eq(userSubscriptions.userId, activeTenantId))
                    .limit(1);
                isPaidUser = sub?.status === 'active' && (sub?.planName === 'Professional' || sub?.planName === 'Business');
            } catch {
                // Default to false
            }

            const publishedIds = new Set<string>();
            for (const row of syncedEntities) {
                const msg = row.data as { id?: string; labelIds?: string[]; internalDate?: string };
                if (!msg.id || publishedIds.has(msg.id)) continue;

                const labels = msg.labelIds ?? [];
                if (labels.length > 0 && !labels.includes('INBOX')) continue;

                if (!(await shouldPublishEvent(activeTenantId, msg.id, msg.internalDate))) continue;

                publishedIds.add(msg.id);
                await publishNewEmailEvent(msg.id, activeTenantId);
                logger.info(`✉️ [Inngest Sync] Published realtime event for email ${msg.id}, tenant ${activeTenantId}`);

                // Only trigger classification for paid users
                if (isPaidUser) {
                    try {
                        const msgData = row.data as { subject?: string; from?: string; snippet?: string };
                        await inngest.send({
                            name: 'email.classify.requested',
                            data: {
                                userId: activeTenantId,
                                emailId: msg.id,
                                subject: msgData?.subject || '',
                                sender: msgData?.from || '',
                                snippet: msgData?.snippet || '',
                            },
                        });
                    } catch (classifyErr) {
                        logger.error(`Failed to trigger classification for email ${msg.id}:`, classifyErr);
                    }
                }
            }

            // If processWebhook's corsair hook didn't fire (or failed), use fallback:
            // List the 5 most recent inbox messages and publish any unseen ones
            if (publishedIds.size === 0) {
                try {
                    const client = corsair.withTenant(activeTenantId);
                    const listRes = await client.gmail.api.messages.list({
                        maxResults: 5,
                        labelIds: ['INBOX'],
                    });

                    if (listRes.messages?.length) {
                        for (const m of listRes.messages) {
                            if (!m.id || publishedIds.has(m.id)) continue;
                            if (!(await shouldPublishEvent(activeTenantId, m.id))) continue;

                            publishedIds.add(m.id);
                            await publishNewEmailEvent(m.id, activeTenantId);
                            logger.info(`✉️ [Inngest Sync] Fallback published realtime event for email ${m.id}, tenant ${activeTenantId}`);
                        }
                    }
                } catch (fallbackErr) {
                    logger.error('[Inngest Sync] Fallback inbox listing failed:', fallbackErr);
                    if (isGmail429Error(fallbackErr)) {
                        await setGmailCooldown(activeTenantId);
                    }
                }
            }
        });

        // REMOVED: run-custom-sync — redundant, processWebhook already fetched the email
        // REMOVED: sync-label-counts — moved to hourly cron job (see syncLabelCounts)

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
                    const textPart = parts.find((p: { mimeType?: string }) => p.mimeType === 'text/plain');
                    if (textPart && textPart.body?.data) {
                        bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
                    } else if (message.payload.body?.data) {
                        bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
                    }
                }

                // Construct context-rich OpenAI summary prompt
                const prompt = `You are a professional email executive assistant. Please summarize the email below in a very simple, concise, and easy-to-understand format.
Format your response exactly as follows:

📢 **What is happening:**
[Provide a simple, 1-2 sentence overview of what the email is about]

👉 **What you need to do:**
[List 1-2 bullet points of clear action items or next steps, if any. Keep them extremely short and simple]

Do not include any greetings, intros, links, sign-offs, or extra text Not verboos And In Bullet point format.

Sender: ${message.payload?.headers?.find((h: { name?: string }) => h.name === 'From')?.value || 'Unknown'}
Subject: ${message.payload?.headers?.find((h: { name?: string }) => h.name === 'Subject')?.value || '(No Subject)'}
Content: ${bodyText.slice(0, 1500)}`;

                const response = await openai.chat.completions.create({
                    model: AI_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 2500,
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
                    logger.info(`[Inngest Summarize] Emitted summary for email ${emailId} to user:${userId}`);
                } else {
                    logger.warn('[Inngest Summarize] Socket.IO server not initialized, could not emit summary.');
                }
            });

            return { success: true };
        } catch (err) {
            logger.error('Error in Inngest email summary workflow:', err);
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

export const draftEmailReply = inngest.createFunction(
    {
        id: 'draft-email-reply',
        name: 'Draft Email Reply',
        triggers: [{ event: 'email.draft.requested' }],
    },
    async ({ event, step }) => {
        const { userId, emailId, userFirstName, userLastName, userEmail, timezone, localTime } = event.data;

        try {
            const draftText = await step.run('generate-draft', async () => {
                const client = corsair.withTenant(userId);

                // Fetch message details
                const message = await client.gmail.api.messages.get({ id: emailId });

                // Extract body and sender
                const subject = message.payload?.headers?.find((h: { name?: string }) => h.name === 'Subject')?.value || '(No Subject)';
                const sender = message.payload?.headers?.find((h: { name?: string }) => h.name === 'From')?.value || 'Unknown';
                const snippet = message.snippet || '';
                let bodyText = snippet;

                if (message.payload) {
                    const parts = message.payload.parts || [];
                    const textPart = parts.find((p: { mimeType?: string }) => p.mimeType === 'text/plain');
                    if (textPart && textPart.body?.data) {
                        bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
                    } else if (message.payload.body?.data) {
                        bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
                    }
                }

                // Construct OpenAI prompt
                const prompt = `You are a professional email executive. Please draft a polite, concise, and contextually appropriate reply to the email below.

Context:
- The user sending this reply is: ${userFirstName || ''} ${userLastName || ''} (${userEmail || ''}). Sign off the email as "${userFirstName || ''} ${userLastName || ''}" (do not use generic signatures or brackets like "[Your Name]").
- The current user's local time is: ${localTime || new Date().toString()} (${timezone || 'UTC'}). Use this to understand relative time references (like "tomorrow", "next week", "yesterday") correctly.

Instructions:
- Write a ready-to-send reply.
- Do not include placeholders like "[Your Name]", "[Company]", or other brackets.
- Match the tone of the sender (professional, polite, or friendly).

Original Email details:
Sender: ${sender}
Subject: ${subject}
Content: ${bodyText.slice(0, 1500)}`;

                const response = await openai.chat.completions.create({
                    model: AI_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 2500,
                });

                return response.choices[0].message.content || 'Failed to generate AI response draft.';
            });

            // Emit draft ready socket event
            await step.run('broadcast-draft', async () => {
                const io = getSocketIO();
                if (io) {
                    io.to(`user:${userId}`).emit('email-draft-ready', {
                        emailId,
                        text: draftText,
                    });
                    logger.info(`[Inngest Draft] Emitted draft for email ${emailId} to user:${userId}`);
                } else {
                    logger.warn('[Inngest Draft] Socket.IO server not initialized, could not emit draft.');
                }
            });

            return { success: true };
        } catch (err) {
            logger.error('Error in Inngest email reply draft workflow:', err);
            // Emit failure event
            const io = getSocketIO();
            if (io) {
                io.to(`user:${userId}`).emit('email-draft-failed', {
                    emailId,
                    error: err instanceof Error ? err.message : 'Failed to generate AI response draft.',
                });
            }
            throw err;
        }
    }
);

export const classifyEmailPriority = inngest.createFunction(
    {
        id: 'classify-email-priority',
        name: 'Classify Email Priority',
        retries: 1,
        triggers: [{ event: 'email.classify.requested' }],
    },
    async ({ event, step }) => {
        const { userId, emailId, subject, sender, snippet } = event.data;

        // Only classify for paid plans (Professional or Business)
        const isPaid = await step.run('check-plan', async () => {
            try {
                const [sub] = await db
                    .select({ planName: userSubscriptions.planName, status: userSubscriptions.status })
                    .from(userSubscriptions)
                    .where(eq(userSubscriptions.userId, userId))
                    .limit(1);
                const plan = sub?.planName || 'Starter';
                const active = sub?.status === 'active';
                return active && (plan === 'Professional' || plan === 'Business');
            } catch {
                return false;
            }
        });

        if (!isPaid) {
            return { skipped: true, reason: 'free_plan' };
        }

        const result = await step.run('llm-classify', async () => {
            const prompt = `You are an email priority classifier. Analyze the following email and return a JSON object with exactly these fields:
- "priority": a number from 1 to 5 (1=urgent, 2=important, 3=normal, 4=low, 5=promotional/spam)
- "category": one of "urgent", "work", "personal", "promotional", "spam"
- "reason": a short 1-sentence explanation

Rules:
- Emails from known contacts, managers, clients, or with action-required keywords → priority 1-2
- Newsletter digests, marketing, offers → priority 4-5, category "promotional"
- Automated system notifications → priority 3, category "work"
- Phishing/spam indicators → priority 5, category "spam"

Email details:
Subject: ${subject}
From: ${sender}
Snippet: ${snippet?.slice(0, 300) || '(empty)'}

Return ONLY valid JSON, no markdown fences, no extra text.`;

            const response = await openai.chat.completions.create({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                response_format: { type: 'json_object' },
            });

            const text = response.choices[0]?.message?.content || '{"priority":3,"category":"normal","reason":"Unable to classify"}';
            try {
                return JSON.parse(text) as { priority: number; category: string; reason: string };
            } catch {
                return { priority: 3, category: 'normal', reason: 'Classification parse error' };
            }
        });

        await step.run('save-priority', async () => {
            const id = `ep_${emailId}_${userId}`;
            try {
                await db
                    .insert(emailPriorities)
                    .values({
                        id,
                        userId,
                        emailId,
                        priority: result.priority,
                        category: result.category,
                        reason: result.reason,
                        scoredAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: emailPriorities.id,
                        set: {
                            priority: result.priority,
                            category: result.category,
                            reason: result.reason,
                            updatedAt: new Date(),
                        },
                    });
            } catch (dbErr) {
                logger.error('Failed to save email priority:', dbErr);
            }
        });

        // Broadcast priority update via Socket.IO
        await step.run('broadcast-priority', async () => {
            const io = getSocketIO();
            if (io) {
                io.to(`user:${userId}`).emit('email-priority-updated', {
                    emailId,
                    priority: result.priority,
                    category: result.category,
                    reason: result.reason,
                });
            }
        });

        return { success: true, priority: result.priority, category: result.category };
    }
);

export const syncLabelCounts = inngest.createFunction(
    {
        id: 'sync-label-counts',
        name: 'Sync Label Counts',
        concurrency: {
            limit: 5,
        },
        triggers: [{ cron: '0 * * * *' }], // every hour
    },
    async ({ step }) => {
        // Get all active Gmail accounts
        const accounts = await step.run('get-active-accounts', async () => {
            return db
                .select({
                    id: corsairAccounts.id,
                    tenantId: corsairAccounts.tenantId,
                })
                .from(corsairAccounts)
                .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
                .where(eq(corsairIntegrations.name, 'gmail'));
        });

        if (accounts.length === 0) return { synced: 0 };

        let synced = 0;
        for (const account of accounts) {
            try {
                await step.run(`sync-labels-${account.id}`, async () => {
                    const gmailConnected = await hasActiveConnection(account.tenantId, 'gmail');
                    if (!gmailConnected) return;

                    const client = corsair.withTenant(account.tenantId);
                    const [inbox, drafts, spam, promotions] = await Promise.all([
                        client.gmail.api.labels.get({ id: 'INBOX' }).catch(() => null),
                        client.gmail.api.labels.get({ id: 'DRAFT' }).catch(() => null),
                        client.gmail.api.labels.get({ id: 'SPAM' }).catch(() => null),
                        client.gmail.api.labels.get({ id: 'CATEGORY_PROMOTIONS' }).catch(() => null),
                    ]);

                    const labelsToSave = [
                        { id: 'INBOX', data: { messagesUnread: inbox?.messagesUnread ?? 0, messagesTotal: inbox?.messagesTotal ?? 0 } },
                        { id: 'DRAFT', data: { messagesTotal: drafts?.messagesTotal ?? 0 } },
                        { id: 'SPAM', data: { messagesTotal: spam?.messagesTotal ?? 0 } },
                        { id: 'CATEGORY_PROMOTIONS', data: { messagesTotal: promotions?.messagesTotal ?? 0 } },
                    ];

                    for (const label of labelsToSave) {
                        await db
                            .insert(corsairEntities)
                            .values({
                                id: `e_labels_${label.id}_a_${account.id}`,
                                accountId: account.id,
                                entityId: label.id,
                                entityType: 'labels',
                                version: '1',
                                data: label.data,
                            })
                            .onConflictDoUpdate({
                                target: corsairEntities.id,
                                set: {
                                    data: label.data,
                                    updatedAt: new Date(),
                                },
                            });
                    }
                    synced++;
                });
            } catch (err) {
                logger.error(`Error syncing labels for account ${account.id}:`, err);
                if (isGmail429Error(err)) {
                    await setGmailCooldown(account.tenantId);
                }
            }
        }

        return { synced };
    }
);
