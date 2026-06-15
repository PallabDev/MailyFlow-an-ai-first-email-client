'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations, corsairEntities, corsairEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function disconnectPlugin(plugin: 'gmail' | 'googlecalendar') {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // 1. Find all accounts for the user connected to this integration name
    const accounts = await db
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          eq(corsairIntegrations.name, plugin)
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

    // 6. Revalidate the onboarding page cache so it updates immediately
    revalidatePath('/onboarding');
  } catch (error) {
    console.error('Error disconnecting plugin:', error);
    throw error;
  }
}
