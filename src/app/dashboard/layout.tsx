import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react';
import ClientLayoutWrapper from '@/features/dashboard/components/ClientLayoutWrapper';
import { db } from '@/lib/corsair';
import { renewWatchesIfNeeded } from '@/lib/corsair/utils';
import { corsairAccounts, corsairIntegrations } from '@/server/db/schema';
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

  // Trigger watch renewal in the background (runs asynchronously on page load)
  renewWatchesIfNeeded(userId).catch((err) => {
    console.error('[Dashboard Layout] Watch renewal check failed:', err);
  });

  // Check if both integrations are connected
  let connectedAccounts: { name: string; config: unknown }[] = [];
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
  }

  const isGmailConnected = connectedAccounts.some((acc) => acc.name === 'gmail' && (acc.config as { access_token?: string })?.access_token);
  const isCalendarConnected = connectedAccounts.some((acc) => acc.name === 'googlecalendar' && (acc.config as { access_token?: string })?.access_token);

  // If either integration is disconnected, redirect to onboarding page
  if (!isGmailConnected || !isCalendarConnected) {
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
