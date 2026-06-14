import { NextRequest, NextResponse } from 'next/server';
import logger from '@/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (message) {
      logger.info(message);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Error logging from API route:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
