'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
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

    // 2. Delete user account connection
    await db
      .delete(corsairAccounts)
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          eq(corsairAccounts.integrationId, integration[0].id)
        )
      );

    // 3. Revalidate the onboarding page cache so it updates immediately
    revalidatePath('/onboarding');
  } catch (error) {
    console.error('Error disconnecting plugin:', error);
    throw error;
  }
}
