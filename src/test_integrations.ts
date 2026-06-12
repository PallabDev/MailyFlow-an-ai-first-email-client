import { db } from './utils/corsair';
import { corsairIntegrations } from './db/schema';

async function main() {
  console.log("Selecting all integrations...");
  try {
    const integrations = await db.select().from(corsairIntegrations);
    console.log("All integrations:", JSON.stringify(integrations, null, 2));
  } catch (error: any) {
    console.error("DB QUERY ERROR:", error);
  }
}

main();
