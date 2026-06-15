import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db, hasActiveConnection } from '@/utils/corsair';
import { chatMessages } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { inngest } from '@/inngest/client';
import { chatMessageSchema } from '@/utils/validation';
import crypto from 'crypto';
import { ChatRequestBody } from './_types';
import { checkRateLimit } from '@/utils/rate-limit';

// GET: Retrieve all chat messages for authenticated user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    let messages: any[] = [];
    try {
      messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(asc(chatMessages.createdAt));
    } catch (dbErr) {
      console.error('Failed to fetch chat messages from DB, returning empty array fallback:', dbErr);
    }

    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error('Error fetching chat messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: Save user input, save pending assistant placeholder, trigger Inngest workflow
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Rate Limiter Check for AI operations
    const rateLimit = await checkRateLimit(userId, 'ai');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.error }, { status: 429 });
    }

    const user = await currentUser();
    if (!user) {
      return new Response('User Profile Not Found', { status: 404 });
    }

    const body = (await req.json()) as ChatRequestBody;
    const parseResult = chatMessageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid message structure or parameters', details: parseResult.error.format() }, { status: 400 });
    }

    const { messages, timezone, localTime } = parseResult.data;

    // Resolve connection status server-side from DB/Corsair key manager before triggering Inngest
    const hasGmailConnection = await hasActiveConnection(userId, 'gmail');
    const hasCalendarConnection = await hasActiveConnection(userId, 'googlecalendar');

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    const userMsgText = messages[messages.length - 1]?.content || '';

    // Insert user and assistant messages in DB (wrap in try-catch to tolerate over-quota/locked DBs)
    try {
      await db.insert(chatMessages).values({
        id: userMessageId,
        userId,
        role: 'user',
        content: userMsgText,
        status: 'completed',
      });

      await db.insert(chatMessages).values({
        id: assistantMessageId,
        userId,
        role: 'assistant',
        content: '',
        status: 'pending',
      });
    } catch (dbErr) {
      console.error('Failed to save chat messages to DB, running in fallback mode:', dbErr);
    }

    // Trigger Inngest workflow
    await inngest.send({
      name: 'chat.message.sent',
      data: {
        userId,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userEmail: user.emailAddresses[0]?.emailAddress || '',
        hasGmailConnection,
        hasCalendarConnection,
        messages: messages, // history of last 6 messages
        timezone,
        localTime,
        assistantMessageId,
      },
    });

    return NextResponse.json({
      success: true,
      userMessageId,
      assistantMessageId,
    });
  } catch (error: unknown) {
    console.error('Error starting chat workflow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Cancel active message processing (prevention of IDOR)
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messageId } = await req.json();
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required for cancellation' }, { status: 400 });
    }

    // Update message status to cancelled in DB - strictly scoped to user to prevent IDOR
    try {
      await db
        .update(chatMessages)
        .set({
          status: 'cancelled',
          content: '⚠️ AI Request paused and cancelled by user.',
          updatedAt: new Date(),
        })
        .where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId)));
    } catch (dbErr) {
      console.error('Failed to cancel message status in DB:', dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error cancelling chat workflow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
