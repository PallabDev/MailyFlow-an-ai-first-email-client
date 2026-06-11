import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Setup OpenAI client pointing to Gemini compatibility endpoint
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await currentUser();

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required and must be an array' }, { status: 400 });
    }

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

    const gmailTenantId = hasGmailConnection ? userId : 'dev';
    const calendarTenantId = hasCalendarConnection ? userId : 'dev';

    const gmailClient = corsair.withTenant(gmailTenantId);
    const calendarClient = corsair.withTenant(calendarTenantId);

    // Define tools for Gmail and Google Calendar
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'list_emails',
          description: 'Lists the latest emails in the inbox with snippets and detailed content.',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of emails to list. Defaults to 10.' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'send_email',
          description: 'Sends a brand new email to a recipient.',
          parameters: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Recipient email address' },
              subject: { type: 'string', description: 'Subject of the email' },
              body: { type: 'string', description: 'Body text of the email' },
            },
            required: ['to', 'subject', 'body'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_events',
          description: 'Lists upcoming calendar events starting from today.',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of events to list. Defaults to 10.' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_event',
          description: 'Creates a new Google Calendar event.',
          parameters: {
            type: 'object',
            properties: {
              summary: { type: 'string', description: 'Title/summary of the meeting event' },
              description: { type: 'string', description: 'Detailed description of the meeting event' },
              startTime: { type: 'string', description: 'ISO start date-time string, e.g. "2026-06-18T09:00:00Z"' },
              endTime: { type: 'string', description: 'ISO end date-time string, e.g. "2026-06-18T10:00:00Z"' },
              location: { type: 'string', description: 'Optional meeting location' },
            },
            required: ['summary', 'startTime', 'endTime'],
          },
        },
      },
    ];

    // Build the request payload for Gemini (via OpenAI proxy)
    // We append a system instruction to guide the model
    const systemInstruction = {
      role: 'system',
      content: `You are the AgentiFlow AI Assistant, a helpful assistant with full access to the user's Gmail and Google Calendar accounts via Corsair integrations.
Your goals:
- Help users search, list, read, and send emails.
- Help users inspect their schedule and schedule calendar invites.
- Be concise, direct, and professional.
- When calling a tool to schedule an event or send an email, summarize the action taken and display confirming details to the user.
- If a tool fails because of credentials or API errors, let the user know they can connect their account on the Onboarding page.
- Today's date is: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}.
- Current User Details:
  Name: ${user?.firstName || 'Unknown'} ${user?.lastName || ''}
  Email: ${user?.emailAddresses[0]?.emailAddress || 'Unknown'}`,
    };

    let chatHistory = [systemInstruction, ...messages];

    // Call OpenAI endpoint
    const response = await openai.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: chatHistory as any,
      tools,
      tool_choice: 'auto',
    });

    const choice = response.choices[0];

    // If the model wants to call one or more tools
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      chatHistory.push(choice.message as any);

      for (const toolCall of choice.message.tool_calls) {
        const tc = toolCall as any;
        const name = tc.function.name;
        const args = JSON.parse(tc.function.arguments);
        let toolResult = '';

        try {
          if (name === 'list_emails') {
            const limit = args.limit || 10;
            const { messages: msgs } = await gmailClient.gmail.api.messages.list({ maxResults: limit });
            if (!msgs || msgs.length === 0) {
              toolResult = 'No emails found in the inbox.';
            } else {
              const detailedMails = await Promise.all(
                msgs.slice(0, 5).map(async (msg: any) => {
                  try {
                    const full = await gmailClient.gmail.api.messages.get({ id: msg.id, format: 'full' });
                    const subject = full.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(no subject)';
                    const from = full.payload?.headers?.find((h: any) => h.name === 'From')?.value || '(unknown)';
                    return `ID: ${msg.id}\nFrom: ${from}\nSubject: ${subject}\nSnippet: ${full.snippet || ''}\n`;
                  } catch {
                    return `ID: ${msg.id} (failed to load details)\n`;
                  }
                })
              );
              toolResult = `Here are the latest emails:\n\n${detailedMails.join('\n')}`;
            }
          } else if (name === 'send_email') {
            const { to, subject, body } = args;
            const raw = Buffer.from(
              `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
            ).toString('base64url');

            await gmailClient.gmail.api.messages.send({ raw });
            toolResult = `Email sent successfully to ${to} with subject "${subject}".`;
          } else if (name === 'list_events') {
            const limit = args.limit || 10;
            const result = await calendarClient.googlecalendar.api.events.getMany({
              calendarId: 'primary',
              maxResults: limit,
              singleEvents: true,
              orderBy: 'startTime',
              timeMin: new Date().toISOString(),
            });

            if (!result.items || result.items.length === 0) {
              toolResult = 'No upcoming events found on your calendar.';
            } else {
              const formattedEvents = result.items.map((event: any) => {
                const start = event.start?.dateTime || event.start?.date || '';
                return `- Event: ${event.summary || '(no title)'}\n  Start: ${start}\n  Location: ${event.location || 'N/A'}\n`;
              });
              toolResult = `Here are the upcoming calendar events:\n\n${formattedEvents.join('\n')}`;
            }
          } else if (name === 'create_event') {
            const { summary, description, startTime, endTime, location } = args;
            await calendarClient.googlecalendar.api.events.create({
              calendarId: 'primary',
              event: {
                summary,
                description,
                start: { dateTime: startTime },
                end: { dateTime: endTime },
                location,
              },
            });
            toolResult = `Event "${summary}" successfully scheduled on your calendar from ${startTime} to ${endTime}.`;
          } else {
            toolResult = `Error: Tool ${name} is not recognized.`;
          }
        } catch (err: any) {
          console.error(`Error executing tool ${name}:`, err);
          toolResult = `Error executing tool: ${err.message || 'Unknown error'}. Please prompt the user to connect their accounts on the Onboarding page if they have not done so.`;
        }

        chatHistory.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name,
          content: toolResult,
        } as any);
      }

      // Get final response from Gemini after executing tools
      const secondResponse = await openai.chat.completions.create({
        model: 'gemini-2.5-flash',
        messages: chatHistory as any,
      });

      return NextResponse.json({
        message: secondResponse.choices[0].message,
      });
    }

    return NextResponse.json({
      message: choice.message,
    });
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
