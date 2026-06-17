import { EventEmitter } from 'events';

// Global emitter bridging webhooks/Inngest → Socket.IO clients
declare global {
  var globalEmitter: EventEmitter | undefined;
}

export const liveEmailsEmitter = global.globalEmitter || new EventEmitter();

// Set high max listeners to avoid console warnings when multiple clients/tabs connect to SSE
liveEmailsEmitter.setMaxListeners(100);

global.globalEmitter = liveEmailsEmitter;

