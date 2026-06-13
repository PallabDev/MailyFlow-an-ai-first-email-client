import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';

import { liveEmailsEmitter } from './src/utils/emitter';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
