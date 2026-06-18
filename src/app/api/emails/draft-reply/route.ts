import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, corsair } from '@/utils/corsair';
import { userSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { openai, AI_MODEL } from '@/utils/openai';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { emailId } = await req.json();
    if (!emailId) {
      return NextResponse.json({ error: 'Missing emailId' }, { status: 400 });
    }

    // 1. Verify user plan
    const [sub] = await db
      .select({ planName: userSubscriptions.planName, status: userSubscriptions.status })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .limit(1);

    const planName = sub?.status === 'active' || sub?.status === 'cancelled' ? (sub?.planName || 'Starter') : 'Starter';
    if (planName === 'Starter') {
      return NextResponse.json({ error: 'Upgrade required. AI reply drafting is a paid feature.' }, { status: 403 });
    }

    // 2. Fetch email details
    const client = corsair.withTenant(userId);
    const message = await client.gmail.api.messages.get({ id: emailId });

    // Extract body and sender
    const subject = message.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
    const sender = message.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown';
    const snippet = message.snippet || '';
    let bodyText = snippet;

    if (message.payload) {
      const parts = message.payload.parts || [];
      const textPart = parts.find((p: any) => p.mimeType === 'text/plain');
      if (textPart && textPart.body?.data) {
        bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf8');
      } else if (message.payload.body?.data) {
        bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
      }
    }

    // 3. Draft a response using OpenAI
    const prompt = `You are a professional email executive. Please draft a polite, concise, and contextually appropriate reply to the email below. 

Instructions:
- Write a ready-to-send reply.
- Do not include placeholders like "[Your Name]", "[Company]", or other brackets.
- Match the tone of the sender (professional, polite, or friendly).

Original Email details:
Sender: ${sender}
Subject: ${subject}
Content: ${bodyText.slice(0, 3000)}`;

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    });

    const draftText = response.choices[0].message.content || '';

    return NextResponse.json({ success: true, text: draftText.trim() });
  } catch (err) {
    console.error('Error in AI reply drafting:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
