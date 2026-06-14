import { NextRequest } from 'next/server';
import { liveEmailsEmitter } from '@/utils/emitter';
import { LiveEmailEvent } from './_types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Send initial comment to flush headers and establish the stream immediately
      controller.enqueue(': open\n\n');

      // Set up a keep-alive ping to prevent connection timeouts on Render
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(': ping\n\n');
        } catch (e) {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      const listener = (eventData: LiveEmailEvent) => {
        controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`);
      };

      liveEmailsEmitter.on('new-email', listener);

      req.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
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
