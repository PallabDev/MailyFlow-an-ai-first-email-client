import { NextRequest } from 'next/server';
import { liveEmailsEmitter } from '@/utils/emitter';
import { LiveEmailEvent } from './_types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const listener = (eventData: LiveEmailEvent) => {
        controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`);
      };

      liveEmailsEmitter.on('new-email', listener);

      req.signal.addEventListener('abort', () => {
        liveEmailsEmitter.off('new-email', listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
