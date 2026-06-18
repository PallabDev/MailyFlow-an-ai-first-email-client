import type { Server as HTTPServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '@clerk/backend';
import { liveEmailsEmitter } from '@/lib/emitter';
import logger from '@/lib/logger';
import type { NewEmailSocketEvent } from '@/types/socket';

export type { NewEmailSocketEvent };

let bridgeRegistered = false;

const recentSocketEvents = new Map<string, number>();
const SOCKET_DEDUP_MS = 10_000;

function registerEmailEventBridge(server: SocketIOServer) {
  if (bridgeRegistered) return;
  bridgeRegistered = true;

  liveEmailsEmitter.on('new-email', (event: { emailId?: string; tenantId?: string }) => {
    if (!event.tenantId || !event.emailId) return;

    const dedupKey = `${event.tenantId}:${event.emailId}`;
    const now = Date.now();
    const lastSent = recentSocketEvents.get(dedupKey);
    if (lastSent && now - lastSent < SOCKET_DEDUP_MS) return;
    recentSocketEvents.set(dedupKey, now);

    server.to(`user:${event.tenantId}`).emit('new-email', { emailId: event.emailId });
    logger.info(`[Socket] Emitted new-email to user:${event.tenantId} → ${event.emailId}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (g.socketIO) return g.socketIO;

  const ioServer = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioServer.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!payload?.sub) {
        return next(new Error('Unauthorized'));
      }

      socket.data.userId = payload.sub;
      next();
    } catch (err) {
      logger.warn('[Socket] Auth failed:', err instanceof Error ? err.message : err);
      next(new Error('Unauthorized'));
    }
  });

  ioServer.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.info(`[Socket] Client connected for user: ${userId}`);

    socket.emit('connected', { message: 'socket ready' });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket] Client disconnected for user: ${userId} (${reason})`);
    });
  });

  registerEmailEventBridge(ioServer);
  g.socketIO = ioServer;
  return ioServer;
}

export function getSocketIO(): SocketIOServer | null {
  return g.socketIO || null;
}
