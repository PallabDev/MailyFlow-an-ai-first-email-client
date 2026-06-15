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
                                    liveEmailsEmitter.emit('new-email', { emailId: newEmail.id, tenantId: ctx.tenantId });
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
