import { EventEmitter } from 'events';

// Global emitter to handle Server-Sent Events (SSE) notification between webhooks and frontend clients
declare global {
  var globalEmitter: EventEmitter | undefined;
}

export const liveEmailsEmitter = global.globalEmitter || new EventEmitter();

// Set high max listeners to avoid console warnings when multiple clients/tabs connect to SSE
liveEmailsEmitter.setMaxListeners(100);

global.globalEmitter = liveEmailsEmitter;

