'use server';

import { db } from '@/utils/corsair';
import { userSubscriptions } from '@/db/schema';
import { createClerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

const CLERK_SECRET_KEY = process.env.PROD_CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY;

export async function listAllUsersAndPlans() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This action is not available in production');
  }

  try {
    const clerkClient = createClerkClient({
      secretKey: CLERK_SECRET_KEY,
    });

    const response = await clerkClient.users.getUserList({
      limit: 100,
    });

    // Support both older Clerk SDKs (returns array directly) and v5+ SDKs (returns { data: [...] })
    const users = Array.isArray(response) ? response : (response.data || []);

    // Get all subscriptions from database
    const subs = await db
      .select()
      .from(userSubscriptions);

    const subMap = new Map(subs.map(s => [s.userId, s]));

    const result = users.map(user => {
      const primaryEmailObj = user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId);
      const email = primaryEmailObj?.emailAddress 
        || user.emailAddresses?.[0]?.emailAddress 
        || '';
      
      const sub = subMap.get(user.id) || { planName: 'Starter', status: 'active', price: '0', endDate: null };

      return {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email,
        planName: sub.planName,
        status: sub.status,
        endDate: sub.endDate ? new Date(sub.endDate).toISOString() : null,
      };
    });

    return { success: true, users: result };
  } catch (error: any) {
    console.error('Failed to list users and plans:', error);
    return { success: false, error: error.message || 'Failed to list users' };
  }
}

export async function grantPaidPlanAccessById(userId: string, planName: 'Starter' | 'Professional' | 'Business') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This action is not available in production');
  }

  try {
    const priceMap = {
      Starter: '0',
      Professional: '599', // matches ₹599
      Business: '999', // matches ₹999
    };

    const endDate = planName === 'Starter' ? null : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

    await db
      .insert(userSubscriptions)
      .values({
        userId,
        planName,
        status: 'active',
        price: priceMap[planName] || '0',
        startDate: new Date(),
        endDate,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
          planName,
          status: 'active',
          price: priceMap[planName] || '0',
          endDate,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update plan by ID:', error);
    return { success: false, error: error.message || 'Failed to update plan' };
  }
}
