import { pool } from './corsair';
import logger from './logger';

/**
 * Publish a new-email event via Postgres NOTIFY so every app instance
 * (including the Socket.IO server) receives it, regardless of which process
 * handled the webhook or Inngest step.
 */
export async function publishNewEmailEvent(emailId: string, tenantId: string): Promise<void> {
  const payload = JSON.stringify({ emailId, tenantId });
  try {
    await pool.query('SELECT pg_notify($1, $2)', ['new_email', payload]);
    logger.info(`[Realtime] pg_notify published for email ${emailId}, tenant ${tenantId}`);
  } catch (err) {
    logger.error(`[Realtime] pg_notify failed for email ${emailId}:`, err);
    throw err;
  }
}
