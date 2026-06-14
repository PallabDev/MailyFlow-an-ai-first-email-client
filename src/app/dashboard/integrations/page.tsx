import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import IntegrationsClient from './IntegrationsClient';

export default async function IntegrationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  let connectedAccounts: any[] = [];
  let dbError = false;
  try {
    connectedAccounts = await db
      .select({
        name: corsairIntegrations.name,
        config: corsairAccounts.config,
      })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(eq(corsairAccounts.tenantId, userId));
  } catch (error) {
    console.error('Error fetching integrations status:', error);
    dbError = true;
  }

  const isGmailConnected = connectedAccounts.some(
    (acc) => acc.name === 'gmail' && (acc.config as any)?.access_token
  );
  const isCalendarConnected = connectedAccounts.some(
    (acc) => acc.name === 'googlecalendar' && (acc.config as any)?.access_token
  );

  return (
    <IntegrationsClient
      isGmailConnected={isGmailConnected}
      isCalendarConnected={isCalendarConnected}
      dbError={dbError}
    />
  );
}
