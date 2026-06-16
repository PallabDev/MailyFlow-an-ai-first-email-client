'use server';

import { auth } from '@clerk/nextjs/server';
import { db, stopWatchesForTenant } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities, corsairEvents } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function disconnectPlugin(plugin: 'gmail' | 'googlecalendar' | 'google') {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Stop all Google watches for the user first to avoid orphaned subscriptions at Google
    try {
      await stopWatchesForTenant(userId);
    } catch (watchErr) {
      console.error('Failed to stop watches during disconnect:', watchErr);
    }

    // 1. Find all accounts for the user connected to Gmail or Google Calendar
    const accounts = await db
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          or(
            eq(corsairIntegrations.name, 'gmail'),
            eq(corsairIntegrations.name, 'googlecalendar')
          )
        )
      );

    for (const account of accounts) {
      const accountId = account.id;

      // 2. Delete dependent rows in corsair_entities
      try {
        await db
          .delete(corsairEntities)
          .where(eq(corsairEntities.accountId, accountId));
      } catch (err) {
        console.error(`Failed to delete entities for account ${accountId}:`, err);
      }

      // 3. Delete dependent rows in corsair_events
      try {
        await db
          .delete(corsairEvents)
          .where(eq(corsairEvents.accountId, accountId));
      } catch (err) {
        console.error(`Failed to delete events for account ${accountId}:`, err);
      }

      // 4. Delete the user account connection
      await db
        .delete(corsairAccounts)
        .where(eq(corsairAccounts.id, accountId));
    }

    // 6. Revalidate pages cache so it updates immediately
    revalidatePath('/onboarding');
    revalidatePath('/dashboard/integrations');
  } catch (error) {
    console.error('Error disconnecting plugin:', error);
    throw error;
  }
}
