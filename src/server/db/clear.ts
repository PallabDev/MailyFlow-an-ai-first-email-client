import 'dotenv/config';
import { Client } from 'pg';
import logger from '@/lib/logger';

async function clearDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("❌ DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  logger.info("⏳ Connecting to database to clear entries...");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    logger.info("🧹 Clearing tables...");
    await client.query('DELETE FROM corsair_events');
    await client.query('DELETE FROM corsair_entities');
    await client.query('DELETE FROM corsair_accounts');
    await client.query('DELETE FROM corsair_integrations');
    await client.query('DELETE FROM chat_messages');
    await client.query('DELETE FROM health_logs');
    await client.query('DELETE FROM user_subscriptions');
    await client.query('DELETE FROM user_usage');
    await client.query('DELETE FROM email_priorities');
    await client.query('DELETE FROM webhook_dedup');
    
    logger.info("✅ Database tables cleared successfully!");
  } catch (err) {
    logger.error("❌ Error clearing database:", err);
  } finally {
    await client.end();
  }
}

clearDatabase();
