import { NextRequest, NextResponse } from 'next/server';
import { sendLogOnTelegram } from '@/utils/LiveTestLogOnTelegram';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (message) {
      await sendLogOnTelegram(message);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error logging to Telegram from API route:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
