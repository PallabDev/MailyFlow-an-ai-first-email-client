import 'dotenv/config';
import { Client } from 'pg';

async function clearDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  console.log("⏳ Connecting to database to clear entries...");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log("🧹 Clearing tables...");
    await client.query('DELETE FROM corsair_events');
    await client.query('DELETE FROM corsair_entities');
    await client.query('DELETE FROM corsair_accounts');
    await client.query('DELETE FROM corsair_integrations');
    await client.query('DELETE FROM chat_messages');
    await client.query('DELETE FROM health_logs');
    await client.query('DELETE FROM user_subscriptions');
    await client.query('DELETE FROM user_usage');
    
    console.log("✅ Database tables cleared successfully!");
  } catch (err) {
    console.error("❌ Error clearing database:", err);
  } finally {
    await client.end();
  }
}

clearDatabase();
