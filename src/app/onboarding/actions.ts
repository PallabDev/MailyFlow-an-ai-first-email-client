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

    // 1. Get integration ID
    const integration = await db
      .select()
      .from(corsairIntegrations)
      .where(eq(corsairIntegrations.name, plugin))
      .limit(1);

    if (integration.length === 0) {
      throw new Error(`Integration ${plugin} not found`);
    }

    // 2. Find the account ID
    const account = await db
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          eq(corsairAccounts.integrationId, integration[0].id)
        )
      )
      .limit(1);

    if (account.length > 0) {
      const accountId = account[0].id;

      // 3. Delete dependent rows in corsair_entities
      await db
        .delete(corsairEntities)
        .where(eq(corsairEntities.accountId, accountId));

      // 4. Delete dependent rows in corsair_events
      await db
        .delete(corsairEvents)
        .where(eq(corsairEvents.accountId, accountId));

      // 5. Delete the user account connection
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
