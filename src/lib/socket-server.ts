import type { Server as HTTPServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '@clerk/backend';
import { liveEmailsEmitter } from '@/utils/emitter';
import logger from '@/utils/logger';
import type { NewEmailSocketEvent } from '@/types/socket';

export type { NewEmailSocketEvent };

let io: SocketIOServer | null = null;
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

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
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

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.info(`[Socket] Client connected for user: ${userId}`);

    socket.emit('connected', { message: 'socket ready' });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket] Client disconnected for user: ${userId} (${reason})`);
    });
  });

  registerEmailEventBridge(io);
  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}
