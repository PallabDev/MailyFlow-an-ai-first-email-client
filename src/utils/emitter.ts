import { EventEmitter } from 'events';

export const liveEmailsEmitter = (global as any).globalEmitter || new EventEmitter();

// Set high max listeners to avoid console warnings when multiple clients/tabs connect to SSE
liveEmailsEmitter.setMaxListeners(100);

(global as any).globalEmitter = liveEmailsEmitter;

