import { db } from '@/lib/corsair';
import { webhookDedup } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import logger from './logger';

/**
 * PostgreSQL-backed webhook deduplication.
 *
 * Table: webhook_dedup (tenant_id, message_id, seen_at)
 *
 * Two types of rows:
 * 1. LAST_SYNC sentinel: message_id = '__last_sync__' → stores last webhook timestamp per tenant
 * 2. Message rows: message_id = actual Gmail message ID → tracks seen messages
 *
 * TTL: rows older than 1 hour are auto-cleaned on each write.
 */

const LAST_SYNC_MSG_ID = '__last_sync__';
const TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get the last webhook sync timestamp for a tenant.
 * Returns null if never synced.
 */
export async function getLastSyncTime(tenantId: string): Promise<Date | null> {
  try {
    const rows = await db
      .select({ seenAt: webhookDedup.seenAt })
      .from(webhookDedup)
      .where(
        and(
          eq(webhookDedup.tenantId, tenantId),
          eq(webhookDedup.messageId, LAST_SYNC_MSG_ID)
        )
      )
      .limit(1);

    return rows[0]?.seenAt ?? null;
  } catch (err) {
    logger.error('[WebhookDedup] Error getting last sync time:', err);
    return null;
  }
}

/**
 * Update the last webhook sync timestamp for a tenant.
 * Upserts the sentinel row.
 */
export async function setLastSyncTime(tenantId: string, time: Date): Promise<void> {
  try {
    const sentinelRow = {
      tenantId,
      messageId: LAST_SYNC_MSG_ID,
      seenAt: time,
    };

    await db
      .insert(webhookDedup)
      .values(sentinelRow)
      .onConflictDoUpdate({
        target: [webhookDedup.tenantId, webhookDedup.messageId],
        set: { seenAt: time },
      });
  } catch (err) {
    logger.error('[WebhookDedup] Error setting last sync time:', err);
  }
}

/**
 * Check if a message ID has already been seen (published) for this tenant.
 * Only checks rows within the TTL window.
 */
export async function isMessageSeen(tenantId: string, messageId: string): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - TTL_MS);
    const rows = await db
      .select({ messageId: webhookDedup.messageId })
      .from(webhookDedup)
      .where(
        and(
          eq(webhookDedup.tenantId, tenantId),
          eq(webhookDedup.messageId, messageId),
          sql`${webhookDedup.seenAt} > ${cutoff}`
        )
      )
      .limit(1);

    return rows.length > 0;
  } catch (err) {
    logger.error('[WebhookDedup] Error checking if message seen:', err);
    return false; // On error, allow the event (fail open)
  }
}

/**
 * Mark a message ID as seen (published) for this tenant.
 * Upserts the row and triggers cleanup of expired rows.
 */
export async function markMessageSeen(tenantId: string, messageId: string): Promise<void> {
  try {
    await db
      .insert(webhookDedup)
      .values({
        tenantId,
        messageId,
        seenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [webhookDedup.tenantId, webhookDedup.messageId],
        set: { seenAt: new Date() },
      });
  } catch (err) {
    logger.error('[WebhookDedup] Error marking message seen:', err);
  }
}

/**
 * Should we publish a Socket.IO event for this message?
 *
 * Returns true only if:
 * 1. The message hasn't been seen before (within TTL)
 * 2. The message is newer than the last sync time (or no last sync exists)
 *
 * Also marks the message as seen if returning true.
 */
export async function shouldPublishEvent(
  tenantId: string,
  messageId: string,
  messageTimestamp?: number | string
): Promise<boolean> {
  // Don't publish if already seen
  if (await isMessageSeen(tenantId, messageId)) {
    return false;
  }

  // Check if message is newer than last sync
  const lastSync = await getLastSyncTime(tenantId);
  if (lastSync && messageTimestamp) {
    const msgTime = typeof messageTimestamp === 'string'
      ? parseInt(messageTimestamp, 10)
      : messageTimestamp;

    if (!isNaN(msgTime) && msgTime < lastSync.getTime()) {
      logger.info(`[WebhookDedup] Skipping old message ${messageId} (msgTime=${msgTime}, lastSync=${lastSync.getTime()})`);
      return false;
    }
  }

  // Mark as seen and allow
  await markMessageSeen(tenantId, messageId);
  return true;
}

/**
 * Delete expired dedup rows (older than TTL).
 * Safe to call periodically — no-ops on error.
 */
export async function cleanupExpiredRows(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - TTL_MS);
    const result = await db
      .delete(webhookDedup)
      .where(sql`${webhookDedup.seenAt} < ${cutoff}`);

    const deleted = result.rowCount ?? 0;
    if (deleted > 0) {
      logger.info(`[WebhookDedup] Cleaned up ${deleted} expired dedup rows`);
    }
    return deleted;
  } catch (err) {
    logger.error('[WebhookDedup] Error cleaning up expired rows:', err);
    return 0;
  }
}

/**
 * Cleanup all data for a tenant (e.g., on disconnect).
 */
export async function cleanupTenant(tenantId: string): Promise<void> {
  try {
    await db
      .delete(webhookDedup)
      .where(eq(webhookDedup.tenantId, tenantId));
  } catch (err) {
    logger.error('[WebhookDedup] Error cleaning up tenant:', err);
  }
}
