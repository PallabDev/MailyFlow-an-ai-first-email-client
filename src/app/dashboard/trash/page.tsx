export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db, corsair } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import FolderPageClient from '../_components/FolderPageClient';

export default async function TrashPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  let connectedAccounts: any[] = [];
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
    console.error('Error querying connected accounts:', error);
  }

  const hasGmail = connectedAccounts.some(
    acc => acc.name === 'gmail' && (acc.config as any)?.access_token
  );
  const gmailTenantId = hasGmail ? userId : 'dev';

  let emails: any[] = [];
  let initialNextPageToken: string | null = null;
  let emailError: string | null = null;

  try {
    const client = corsair.withTenant(gmailTenantId);
    const result = await client.gmail.api.messages.list({
      maxResults: 50,
      labelIds: ['TRASH'],
    });
    initialNextPageToken = result.nextPageToken || null;
    const messages = result.messages;

    if (messages && messages.length > 0) {
      emails = await Promise.all(
        messages.map(async (msg: any) => {
          try {
            const full = await client.gmail.api.messages.get({
              id: msg.id!,
              format: 'metadata',
            });
            const headers = full.payload?.headers ?? [];
            const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value ?? '(no subject)';
            const from = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value ?? '(unknown)';
            const date = headers.find((h: any) => h.name?.toLowerCase() === 'date')?.value ?? '';

            return {
              id: msg.id,
              from,
              date,
              subject,
              snippet: full.snippet ?? '',
              body: '',
              labelIds: full.labelIds ?? [],
            };
          } catch (e: any) {
            console.error(`Error fetching message ${msg.id}:`, e);
            return {
              id: msg.id,
              from: '(unknown)',
              date: '',
              subject: '(failed to load)',
              snippet: '',
              body: '',
              labelIds: [],
            };
          }
        })
      );
    }
  } catch (err: any) {
    console.error('Error listing emails:', err);
    emailError = err.message || 'Failed to list Gmail messages.';
  }

  return (
    <FolderPageClient
      initialEmails={emails}
      initialNextPageToken={initialNextPageToken}
      folder="trash"
      title="Trash"
      emailError={emailError}
    />
  );
}
