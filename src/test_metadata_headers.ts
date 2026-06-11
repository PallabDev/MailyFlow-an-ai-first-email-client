import { db, corsair } from './utils/corsair';
import { corsairAccounts, corsairIntegrations } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const connectedAccounts = await db
      .select({
        name: corsairIntegrations.name,
        config: corsairAccounts.config,
        tenantId: corsairAccounts.tenantId,
      })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id));

    const gmailAcc = connectedAccounts.find(acc => acc.name === 'gmail');
    const tenantId = gmailAcc ? gmailAcc.tenantId : 'dev';
    console.log("Using tenantId:", tenantId);

    const client = corsair.withTenant(tenantId);
    const { messages } = await client.gmail.api.messages.list({
      maxResults: 10,
      labelIds: ['INBOX'],
    });

    if (messages) {
      for (const msg of messages) {
        const full = await client.gmail.api.messages.get({
          id: msg.id!,
          format: 'metadata',
        });
        const headers = full.payload?.headers;
        console.log(`Msg ID: ${msg.id}`);
        console.log(`- Has payload: ${!!full.payload}`);
        console.log(`- Has headers: ${!!headers} (length: ${headers?.length ?? 0})`);
        if (headers) {
          const sub = headers.find((h: any) => h.name === 'Subject')?.value;
          const from = headers.find((h: any) => h.name === 'From')?.value;
          console.log(`- Subject: ${sub}, From: ${from}`);
        }
      }
    }
  } catch (error: any) {
    console.error("Error:", error);
  }
}

main();
