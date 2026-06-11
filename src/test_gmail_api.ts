import { db, corsair } from './utils/corsair';
import { corsairAccounts, corsairIntegrations } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log("Checking Gmail accounts...");
  try {
    const connectedAccounts = await db
      .select({
        name: corsairIntegrations.name,
        config: corsairAccounts.config,
        tenantId: corsairAccounts.tenantId,
      })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id));

    console.log("Connected Accounts in DB:", connectedAccounts);

    const gmailAcc = connectedAccounts.find(acc => acc.name === 'gmail');
    const tenantId = gmailAcc ? gmailAcc.tenantId : 'dev';
    console.log("Using tenantId:", tenantId);

    const client = corsair.withTenant(tenantId);
    console.log("Listing messages...");
    const { messages } = await client.gmail.api.messages.list({
      maxResults: 2,
      labelIds: ['INBOX'],
    });

    console.log("Messages list:", messages);

    if (messages && messages.length > 0) {
      const msgId = messages[0].id!;
      console.log("Fetching message details for ID:", msgId);

      console.log("\n--- TEST 1: format 'metadata' without metadataHeaders ---");
      const metadataNoHeaders = await client.gmail.api.messages.get({
        id: msgId,
        format: 'metadata',
      });
      console.log("No metadataHeaders response payload headers:", metadataNoHeaders.payload?.headers);
      console.log("Snippet:", metadataNoHeaders.snippet);

      console.log("\n--- TEST 2: format 'metadata' with metadataHeaders ['Subject', 'From', 'Date'] ---");
      const metadataWithHeaders = await client.gmail.api.messages.get({
        id: msgId,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      } as any);
      console.log("With metadataHeaders response payload headers:", metadataWithHeaders.payload?.headers);

      console.log("\n--- TEST 3: format 'full' ---");
      const fullResponse = await client.gmail.api.messages.get({
        id: msgId,
        format: 'full',
      });
      console.log("Full response headers length:", fullResponse.payload?.headers?.length);
      const subject = fullResponse.payload?.headers?.find((h: any) => h.name === 'Subject')?.value;
      const from = fullResponse.payload?.headers?.find((h: any) => h.name === 'From')?.value;
      console.log("Subject:", subject, "From:", from);
    }
  } catch (error: any) {
    console.error("ERROR running gmail test:", error);
  }
}

main();
