import { EventEmitter } from 'events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
export const liveEmailsEmitter = g.globalEmitter || new EventEmitter();

// Set high max listeners to avoid console warnings when multiple clients/tabs connect to SSE
liveEmailsEmitter.setMaxListeners(100);

g.globalEmitter = liveEmailsEmitter;

