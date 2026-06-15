import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react';
import ClientLayoutWrapper from './_components/ClientLayoutWrapper';
import { db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=' + encodeURIComponent('/dashboard/inbox'));
  }

  const user = await currentUser();
  if (!user) {
    redirect('/sign-in?redirect_url=' + encodeURIComponent('/dashboard/inbox'));
  }

  // Check if both integrations are connected
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
    console.error('Error querying connected accounts in dashboard layout:', error);
    dbError = true;
  }

  const isGmailConnected = connectedAccounts.some((acc) => acc.name === 'gmail' && (acc.config as any)?.access_token);
  const isCalendarConnected = connectedAccounts.some((acc) => acc.name === 'googlecalendar' && (acc.config as any)?.access_token);

  // If the database has a quota error, do NOT redirect to onboarding since they won't be able to connect anyway.
  // Instead, allow them to view the dashboard with local mocks/memory fallback.
  if (!dbError && (!isGmailConnected || !isCalendarConnected)) {
    redirect('/onboarding');
  }

  const serializedUser = {
    id: userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress || '',
    imageUrl: user.imageUrl,
  };

  const projectName = process.env.ProjectName || 'MailyFlow';

  return (
    <ClientLayoutWrapper user={serializedUser} projectName={projectName}>
      {children}
    </ClientLayoutWrapper>
  );

}
