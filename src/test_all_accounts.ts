import { db } from './utils/corsair';
import { corsairAccounts } from './db/schema';

async function main() {
  console.log("Selecting all accounts from corsairAccounts...");
  try {
    const accounts = await db.select().from(corsairAccounts);
    console.log("All accounts in DB:", JSON.stringify(accounts, null, 2));
  } catch (error: any) {
    console.error("DB QUERY ERROR:", error);
  }
}

main();
