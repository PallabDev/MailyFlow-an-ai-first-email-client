import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { createIntegrationKeyManager } from 'corsair/core';
import crypto from 'crypto';

import { liveEmailsEmitter } from './src/utils/emitter';
import logger from './src/utils/logger';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool); // your app tables

// Shared PG notification listener to bridge webhooks across instances in real-time
let pgListenerClient: any = null;

async function startPgListener() {
    if (pgListenerClient) return;

    try {
        const client = await pool.connect();
        pgListenerClient = client;

        await client.query('LISTEN new_email');
        console.log('🔊 [PG Listener] Successfully listening to new_email Postgres channel');

        client.on('notification', (msg) => {
            if (msg.channel === 'new_email' && msg.payload) {
                try {
                    const data = JSON.parse(msg.payload);
                    if (data.emailId && data.tenantId) {
                        logger.info(`🔊 [PG Listener] Received notification for email ${data.emailId}, tenant: ${data.tenantId}`);
                        liveEmailsEmitter.emit('new-email', { emailId: data.emailId, tenantId: data.tenantId });
                    }
                } catch (e) {
                    console.error('[PG Listener] Failed to parse notification payload:', e);
                }
            }
        });

        client.on('error', (err) => {
            console.error('[PG Listener] DB client error, reconnecting...', err);
            pgListenerClient = null;
            client.release();
            setTimeout(startPgListener, 5000);
        });
    } catch (err) {
        console.error('[PG Listener] Failed to start listening to Postgres notifications:', err);
        pgListenerClient = null;
        setTimeout(startPgListener, 5000);
    }
}

// Start the listener
if (process.env.DATABASE_URL) {
    startPgListener().catch(err => console.error('[PG Listener] Error in startup:', err));
}

export const corsair = createCorsair({
    plugins: [
        gmail({
            webhookHooks: {
                messageChanged: {
                    after: async (ctx, response) => {
                        logger.info(`[Gmail Hook after] Webhook hook callback triggered. Success: ${response.success}, Type: ${response.data?.type || 'unknown'}`);
                        if (response.success && response.data) {
                            const eventType = response.data.type;
                            if (eventType === 'messageReceived' || eventType === 'messageLabelChanged') {
                                const newEmail = response.data.message;
                                if (newEmail && newEmail.id) {
                                    logger.info(`📩 [Gmail Hook] Received and processing email event [${eventType}]`);
                                    
                                    // 1. Emit locally for immediate response
                                    liveEmailsEmitter.emit('new-email', { emailId: newEmail.id, tenantId: ctx.tenantId });
                                    
                                    // 2. Publish to Postgres NOTIFY to sync across instances
                                    try {
                                        const payload = JSON.stringify({ emailId: newEmail.id, tenantId: ctx.tenantId });
                                        await pool.query('SELECT pg_notify($1, $2)', ['new_email', payload]);
                                        logger.info(`🔊 [Gmail Hook] Published pg_notify for new email event`);
                                    } catch (pgErr) {
                                        logger.error(`[Gmail Hook] Failed to send pg_notify:`, pgErr);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }),
        googlecalendar()
    ],
    database: pool,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});

/** Always overwrite Google OAuth integration credentials from env (fixes stale DB values). */
export async function syncGoogleCredentialsFromEnv() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET.trim();

    const database = (corsair as any)[Symbol.for("corsair:internal")]?.database || pool;
    const kek = process.env.CORSAIR_KEK!;

    const integrations = ['gmail', 'googlecalendar'] as const;
    for (const pluginType of integrations) {
        let integration = await database.db
            .selectFrom("corsair_integrations")
            .selectAll()
            .where("name", "=", pluginType)
            .executeTakeFirst();

        if (!integration) {
            console.log(`[Corsair Init] Seeding integration database record for: ${pluginType}`);
            const id = crypto.randomUUID();
            await database.db
                .insertInto("corsair_integrations")
                .values({
                    id,
                    name: pluginType,
                    config: JSON.stringify({}),
                    created_at: new Date(),
                    updated_at: new Date()
                })
                .execute();

            integration = await database.db
                .selectFrom("corsair_integrations")
                .selectAll()
                .where("id", "=", id)
                .executeTakeFirst();
        }

        const extraFields = pluginType === 'gmail' ? ["topic_id"] : [];
        const integrationKm = createIntegrationKeyManager({
            authType: "oauth_2",
            integrationName: pluginType,
            kek,
            database,
            extraIntegrationFields: extraFields
        });

        if (!integration.dek) {
            await integrationKm.issue_new_dek();
        }

        await integrationKm.set_client_id(clientId);
        await integrationKm.set_client_secret(clientSecret);
        console.log(`[Corsair Init] Synced OAuth credentials for ${pluginType} from environment.`);

        if (pluginType === 'gmail' && process.env.TOPIC_ID) {
            await (integrationKm as any).set_topic_id(process.env.TOPIC_ID.trim());
            console.log(`[Corsair Init] Synced topic_id for gmail from environment.`);
        }
    }
}

let syncPromise: Promise<void> | null = null;

/** Deduped sync — safe to call from startup hooks and API routes. */
export function ensureGoogleCredentialsSynced(): Promise<void> {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return Promise.resolve();
    }

    if (!syncPromise) {
        syncPromise = syncGoogleCredentialsFromEnv().catch((err) => {
            syncPromise = null;
            throw err;
        });
    }

    return syncPromise;
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    ensureGoogleCredentialsSynced().catch((err) => {
        console.error('[Corsair Init] Error synchronizing environment credentials to database:', err);
    });
}
