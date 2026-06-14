import { inngest } from './client';
import { db, corsair } from '@/utils/corsair';
import { chatMessages } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { openai, AI_MODEL } from '@/utils/openai';
import { getSystemInstruction } from '@/system/ai_system';
import { OpenAIAgentsProvider } from '@corsair-dev/mcp';
import { Agent, run, tool, OpenAIProvider, setDefaultModelProvider } from '@openai/agents';

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

      // Build system instructions using system promts helper
      const systemInstruction = getSystemInstruction({
        projectName: process.env.ProjectName || 'MailyFlow',
        userLocalTime: localTime || new Date().toISOString(),
        userTimezone: timezone || 'UTC',
        userName: `${userFirstName || 'Unknown'} ${userLastName || ''}`.trim(),
        userEmail: userEmail || 'Unknown',
        hasGmailConnection,
        hasCalendarConnection,
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

      const result = await run(agent, formatHistoryMessages(dbHistory));
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
    });

    // Save output to the DB if the message has not been cancelled by the user
    await step.run('save-to-db', async () => {
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
inngest.createFunction(
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
