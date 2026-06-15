import { NextRequest } from 'next/server';
import { liveEmailsEmitter } from '@/utils/emitter';
import { LiveEmailEvent } from './_types';
import logger from '@/utils/logger';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial comment to flush headers and establish the stream immediately
      controller.enqueue(': open\n\n');

      // Send a handshake message to verify the SSE communication channel is working
      const handshake = JSON.stringify({ type: 'init', message: 'hello from server' });
      controller.enqueue(`data: ${handshake}\n\n`);

      // Log connection
      logger.info(`[Live SSE] Client connected to live email SSE feed for user: ${userId}. Handshake sent.`);

      // Set up a keep-alive ping to prevent connection timeouts on Render
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(': ping\n\n');
        } catch (e) {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      const listener = (eventData: LiveEmailEvent) => {
        try {
          if (eventData.tenantId !== userId) {
            // Filter events that don't belong to the authenticated user
            return;
          }
          logger.info(`[Live SSE] SSE Route received 'new-email' event for ID: ${eventData.emailId}. Streaming to client...`);
          controller.enqueue(`data: ${JSON.stringify({ emailId: eventData.emailId })}\n\n`);
        } catch (e) {
          console.error('Error enqueuing message to SSE controller:', e);
        }
      };

      liveEmailsEmitter.on('new-email', listener);

      req.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        liveEmailsEmitter.off('new-email', listener);
        logger.info(`[Live SSE] Client aborted/disconnected live email SSE feed for user: ${userId}.`);
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
