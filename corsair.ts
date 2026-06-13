import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { createIntegrationKeyManager } from 'corsair/core';
import crypto from 'crypto';

import { liveEmailsEmitter } from './src/utils/emitter';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool); // your app tables

export const corsair = createCorsair({
    plugins: [
        gmail({
            webhookHooks: {
                messageChanged: {
                    after: async (ctx, response) => {
                        if (response.success && response.data?.type === 'messageReceived') {
                            const newEmail = response.data.message;
                            if (newEmail && newEmail.id) {
                                console.log('📩 Corsair Webhook New Mail Received:', newEmail.id);
                                liveEmailsEmitter.emit('new-email', { emailId: newEmail.id });
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

// Automatically synchronize credentials from environment variables to database integrations
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    (async () => {
        try {
            const database = (corsair as any)[Symbol.for("corsair:internal")]?.database || pool;
            const kek = process.env.CORSAIR_KEK!;

            const integrations = ['gmail', 'googlecalendar'];
            for (const pluginType of integrations) {
                // Ensure integration record exists in DB
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

                // Initialize DEK if not present
                if (!integration.dek) {
                    await integrationKm.issue_new_dek();
                }

                // Synchronize fields from environment variables
                const currentClientId = await integrationKm.get_client_id();
                const currentClientSecret = await integrationKm.get_client_secret();

                if (currentClientId !== process.env.GOOGLE_CLIENT_ID) {
                    await integrationKm.set_client_id(process.env.GOOGLE_CLIENT_ID!);
                    console.log(`[Corsair Init] Updated client_id for ${pluginType} from environment variables.`);
                }
                if (currentClientSecret !== process.env.GOOGLE_CLIENT_SECRET) {
                    await integrationKm.set_client_secret(process.env.GOOGLE_CLIENT_SECRET!);
                    console.log(`[Corsair Init] Updated client_secret for ${pluginType} from environment variables.`);
                }

                if (pluginType === 'gmail' && process.env.TOPIC_ID) {
                    const currentTopicId = await (integrationKm as any).get_topic_id();
                    if (currentTopicId !== process.env.TOPIC_ID) {
                        await (integrationKm as any).set_topic_id(process.env.TOPIC_ID);
                        console.log(`[Corsair Init] Updated topic_id for gmail from environment variables.`);
                    }
                }
            }
        } catch (err) {
            console.error('[Corsair Init] Error synchronizing environment credentials to database:', err);
        }
    })();
}
