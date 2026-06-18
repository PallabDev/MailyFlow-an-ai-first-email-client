import { db } from './corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import logger from '@/lib/logger';

export async function getGmailCooldownExpiration(tenantId: string): Promise<number> {
  try {
    const gmailAccount = await db
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(
        and(
          eq(corsairAccounts.tenantId, tenantId),
          eq(corsairIntegrations.name, 'gmail')
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!gmailAccount) return 0;

    const row = await db
      .select({ data: corsairEntities.data })
      .from(corsairEntities)
      .where(
        and(
          eq(corsairEntities.accountId, gmailAccount.id),
          eq(corsairEntities.entityId, 'gmail_cooldown'),
          eq(corsairEntities.entityType, 'cooldown')
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (row && row.data && typeof (row.data as Record<string, unknown>).expiration === 'number') {
      return (row.data as Record<string, unknown>).expiration as number;
    }
  } catch (err) {
    logger.error('Failed to get Gmail cooldown expiration:', err);
  }
  return 0;
}

export async function setGmailCooldown(tenantId: string, durationMs: number = 20 * 60 * 1000): Promise<void> {
  try {
    const gmailAccount = await db
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(
        and(
          eq(corsairAccounts.tenantId, tenantId),
          eq(corsairIntegrations.name, 'gmail')
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!gmailAccount) return;

    const entityRowId = `e_cooldown_gmail_a_${gmailAccount.id}`;
    const expiration = Date.now() + durationMs;

    await db
      .insert(corsairEntities)
      .values({
        id: entityRowId,
        accountId: gmailAccount.id,
        entityId: 'gmail_cooldown',
        entityType: 'cooldown',
        version: '1',
        data: { expiration },
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: corsairEntities.id,
        set: {
          data: { expiration },
          updatedAt: new Date(),
        },
      });
    logger.info(`⏳ [Cooldown] Set Gmail API cooldown for tenant ${tenantId} until ${new Date(expiration).toISOString()}`);
  } catch (err) {
    logger.error('Failed to set Gmail cooldown:', err);
  }
}
