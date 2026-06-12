import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { OpenAIAgentsProvider } from '@corsair-dev/mcp';
import { Agent, run, tool, OpenAIProvider, setDefaultModelProvider } from '@openai/agents';

// Setup OpenAI client pointing to AICredits endpoint
const openai = new OpenAI({
    baseURL: 'https://api.aicredits.in/v1',
    apiKey: 'sk-live-3aa3b07f4d35558af57dcb0aaea1738909a97ec432afc7c662ea4025c9401f14',
});

// Proxy completions.create to inject the models array parameter for AICredits
const originalCreate = openai.chat.completions.create.bind(openai.chat.completions);
openai.chat.completions.create = function (body: any, options?: any) {
    const { model, ...rest } = body;
    return originalCreate({
        ...rest,
        // @ts-expect-error — AICredits extension
        models: ["gpt-4o", "claude-sonnet-4-5", "gemini-1.5-pro"],
    }, options);
} as any;

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response('Unauthorized', { status: 401 });
        }

        const user = await currentUser();

        const { messages, timezone, localTime } = await req.json();
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages are required and must be an array' }, { status: 400 });
        }

        // Slice history to the last 6 messages to avoid Groq's Tokens Per Minute (TPM) limits
        const slicedMessages = messages.slice(-6);

        const userTimezone = timezone || 'UTC';
        const userLocalTime = localTime || new Date().toISOString();

        // Determine separate tenant IDs for Gmail and Google Calendar
        let connectedAccounts: any[] = [];
        try {
            connectedAccounts = await db
                .select({
                    name: corsairIntegrations.name,
                    config: corsairAccounts.config,
                })
                .from(corsairAccounts)
                .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
                .where(eq(corsairAccounts.tenantId, userId));
        } catch (e) {
            console.error('Error fetching connected accounts:', e);
        }
        const hasGmailConnection = connectedAccounts.some(
            acc => acc.name === 'gmail' && (acc.config as any)?.access_token
        );
        const hasCalendarConnection = connectedAccounts.some(
            acc => acc.name === 'googlecalendar' && (acc.config as any)?.access_token
        );

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

        // Configure the OpenAI provider for agents
        const openaiProvider = new OpenAIProvider({
            openAIClient: openai,
        });
        setDefaultModelProvider(openaiProvider);

        // Build the system instructions
        const systemInstruction = `You are the AgentiFlow AI Assistant, a helpful assistant with full access to the user's Gmail and Google Calendar accounts.
You have access to Corsair tools. Use list_operations to discover available APIs, get_schema to understand required arguments, and run_script to execute them.

- CRITICAL: When calling the \`run_script\` tool, you MUST write the entire JavaScript code in a single line, using semicolon separators (\`;\`) instead of actual newline characters. Do NOT output raw newline characters inside the \`code\` string, because it makes the JSON invalid and fails.
- In \`run_script\`, the variable \`corsair\` is the ONLY variable in scope.
- To create calendar events, use:
await corsair.googlecalendar.api.events.create({ event: { summary: '...', start: { dateTime: '...' }, end: { dateTime: '...' } } });
- To send an email, use:
const emailContent = [ 'To: recipient@example.com', 'Subject: Hello', 'Content-Type: text/plain; charset=utf-8', '', 'Email body' ].join('\\r\\n'); const raw = Buffer.from(emailContent).toString('base64url'); await corsair.gmail.api.messages.send({ raw });
- To create an email draft, use:
const emailContent = [ 'To: recipient@example.com', 'Subject: Hello', 'Content-Type: text/plain; charset=utf-8', '', 'Email body' ].join('\\r\\n'); const raw = Buffer.from(emailContent).toString('base64url'); await corsair.gmail.api.drafts.create({ draft: { message: { raw } } });
- If the user asks to schedule/delay a task at a future time (e.g. "in 10 minutes"), do not use \`setTimeout\` or \`corsair.sleep\`. Instead, execute the creation/sending/drafting immediately and inform the user you did so.
- IMPORTANT: If a tool fails because of code syntax errors, typos, or runtime errors (e.g., "ReferenceError" or "TypeError" in the script), do NOT tell the user to connect their account. Instead, fix the script typo/code error in your next turn and run it again. Only ask them to connect their account if the tool execution fails specifically with credentials, authentication, or unauthorized errors (e.g. 401, Invalid Credentials, missing tokens).

- Be extremely concise, direct, and short. Do not write long explanations, introductory fluff, bullet points of your capabilities, or sign-offs unless explicitly requested. Respond in 1-2 short sentences maximum whenever possible.
- For general talk/conversations (like greetings, "hi", "how are you"), respond friendly and normally. Do NOT prompt them to connect accounts or mention the onboarding page in general talk.
- If the user requests a Gmail/Calendar action but is not connected, state in a single short sentence that they need to connect on the Onboarding page.
- Do NOT provide programming code, software assistance, code blocks, or general technical/coding advice.
- Keep your answers and guidance strictly focused on managing emails, scheduling calendar events, and assisting with tasks inside this app (AgentiFlow). Do not answer queries or discuss topics completely unrelated to this app, Gmail, or Google Calendar.
- If a tool fails because of credentials or API errors, let the user know they can connect their account on the Onboarding page in a single short sentence.
- Today's local date and time is: ${userLocalTime}. The user's timezone is: ${userTimezone}.
- When scheduling events, interpret relative dates/times and specific time requests relative to the user's local time (${userLocalTime}) and timezone (${userTimezone}).
- Always create/update events in the user's local timezone (${userTimezone}), calculating and formatting start/end date-times as ISO 8601 strings with the correct offset (like +05:30 for Asia/Kolkata). Do not use UTC/Z timezone if the user specifies a local time in their timezone.
- CRITICAL: Never output raw XML tags, XML elements, JSON payloads, or function tag blocks (e.g., <function=...> or </function>) in your conversational text responses. All actions and functions must be executed strictly through the system's official tool/function calling mechanism.
- Current User Details:
  Name: ${user?.firstName || 'Unknown'} ${user?.lastName || ''}
  Email: ${user?.emailAddresses[0]?.emailAddress || 'Unknown'}
  Gmail Connection Status: ${hasGmailConnection ? 'Connected' : 'Not Connected'}
  Google Calendar Connection Status: ${hasCalendarConnection ? 'Connected' : 'Not Connected'}`;

        const agent = new Agent({
            name: 'corsair-agent',
            model: 'deepseek/deepseek-chat',
            instructions: systemInstruction,
            tools,
        });

        const formatHistoryMessages = (msgs: any[]) => {
            return msgs.map((m: any) => {
                if (m.role === 'assistant' && typeof m.content === 'string') {
                    return {
                        role: 'assistant',
                        content: [{ type: 'output_text', text: m.content }],
                    };
                }
                return m;
            });
        };

        let result;
        try {
            result = await run(agent, formatHistoryMessages(slicedMessages));
        } catch (err: any) {
            const isRateLimit = err.status === 429 || err.status === 413 || err.message?.includes('Limit') || err.message?.includes('limit');
            if (isRateLimit) {
                console.warn('Initial Qwen request rate-limited/too large. Retrying with a smaller history slice...');
                try {
                    const minimalMessages = messages.slice(-4);
                    result = await run(agent, formatHistoryMessages(minimalMessages));
                } catch (errFallback: any) {
                    console.warn('Qwen minimal run failed. Falling back to llama-3.1-8b-instant...');
                    const fallbackAgent = new Agent({
                        name: 'corsair-agent-fallback',
                        model: 'deepseek/deepseek-chat',
                        instructions: systemInstruction,
                        tools,
                    });
                    const fallbackMessages = messages.slice(-4);
                    result = await run(fallbackAgent, formatHistoryMessages(fallbackMessages));
                }
            } else {
                throw err;
            }
        }

        let outputText = result.finalOutput || '';
        // Strip any leaked function/tool call tags (e.g. <function...>, <function/run_script...>, <run_script...>, etc.)
        outputText = outputText.replace(/<(function|run_script|tool|tool_call)[^>]*>[\s\S]*?<\/\1>/gi, '');
        outputText = outputText.replace(/<function\/(run_script|tool_call)[^>]*>[\s\S]*?<\/function\/\1>/gi, '');
        outputText = outputText.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/gi, (match) => {
            const lower = match.toLowerCase();
            if (lower.includes('function') || lower.includes('script') || lower.includes('tool') || lower.includes('code') || lower.includes('auth')) {
                return '';
            }
            return match;
        });
        outputText = outputText.trim();

        return NextResponse.json({
            message: {
                role: 'assistant',
                content: outputText,
            },
        });
    } catch (error: any) {
        console.error('Error in chat route:', error);
        let userMessage = error.message || 'Internal Server Error';
        if (
            userMessage.includes('Limit') ||
            userMessage.includes('limit') ||
            error.status === 413 ||
            error.status === 429
        ) {
            userMessage = 'The AI Assistant is experiencing a high volume of requests. Please wait a few seconds and try sending a shorter message.';
        }
        return NextResponse.json({ error: userMessage }, { status: error.status || 500 });
    }
}
