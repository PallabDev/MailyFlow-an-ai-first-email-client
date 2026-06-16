import { NextRequest, NextResponse } from 'next/server';
import { corsair, pool, syncGoogleCredentialsFromEnv, db } from '@/utils/corsair';
import { processOAuthCallback } from 'corsair/oauth';
import { createIntegrationKeyManager, createAccountKeyManager } from 'corsair/core';
import crypto from 'crypto';
import { GoogleTokenResponse, GoogleWatchResponse } from './_types';
import { createCorsairDatabase, type CorsairDatabase } from 'corsair/db';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
    }
    const redirectUri = `${origin}/api/auth/callback`;

    await syncGoogleCredentialsFromEnv();

    const { plugin, tenantId } = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri,
    });

    // Automatically register Gmail webhook watch subscription if user connected their Gmail account
    if (plugin === 'gmail') {
      try {
        const kek = process.env.CORSAIR_KEK!;
        const databaseInternal = (corsair as { [key: symbol]: { database?: CorsairDatabase } | undefined })[Symbol.for("corsair:internal")]?.database;
        const database = databaseInternal || createCorsairDatabase(pool);

        const integrationKm = createIntegrationKeyManager({
          authType: "oauth_2",
          integrationName: 'gmail',
          kek,
          database,
          extraIntegrationFields: ["topic_id"]
        });

        const accountKm = createAccountKeyManager({
          authType: "oauth_2",
          integrationName: 'gmail',
          tenantId,
          kek,
          database
        });

        const clientId = await integrationKm.get_client_id();
        const clientSecret = await integrationKm.get_client_secret();
        const refreshToken = await accountKm.get_refresh_token();
        const topicId = (await (integrationKm as any).get_topic_id()) || process.env.TOPIC_ID;

        if (clientId && clientSecret && refreshToken && topicId) {
          console.log(`[OAuth Callback] Refreshing Gmail access token for tenant: ${tenantId}`);
          
          // 1. Refresh Google access token
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: "refresh_token"
            })
          });

          if (tokenRes.ok) {
            const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
            const accessToken = tokenData.access_token;

            console.log(`[OAuth Callback] Registering Gmail watch for tenant: ${tenantId} on topic: ${topicId}`);
            
            // 2. Call Gmail Watch API
            const watchRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                topicName: topicId,
                labelIds: ["INBOX"]
              })
            });

            if (watchRes.ok) {
              const watchData = (await watchRes.json()) as GoogleWatchResponse;
              console.log(`[OAuth Callback] Gmail watch registered successfully for user ${tenantId}. Expiration: ${new Date(Number(watchData.expiration)).toISOString()}`);
            } else {
              const errText = await watchRes.text();
              console.error(`[OAuth Callback] Gmail watch API call failed: ${errText}`);
            }
          } else {
            const errText = await tokenRes.text();
            console.error(`[OAuth Callback] Failed to refresh access token for Gmail watch: ${errText}`);
          }
        } else {
          console.warn(`[OAuth Callback] Missing credentials for Gmail watch setup (clientId: ${!!clientId}, clientSecret: ${!!clientSecret}, refreshToken: ${!!refreshToken}, topicId: ${!!topicId})`);
        }

        // --- DUPLICATE TO GOOGLE CALENDAR ---
        const calendarIntegration = await db
          .select()
          .from(corsairIntegrations)
          .where(eq(corsairIntegrations.name, 'googlecalendar'))
          .then((rows) => rows[0]);

        if (calendarIntegration) {
          const gmailIntegration = await db
            .select()
            .from(corsairIntegrations)
            .where(eq(corsairIntegrations.name, 'gmail'))
            .then((rows) => rows[0]);

          const gmailAccount = await db
            .select()
            .from(corsairAccounts)
            .where(
              and(
                eq(corsairAccounts.tenantId, tenantId),
                eq(corsairAccounts.integrationId, gmailIntegration.id)
              )
            )
            .then((rows) => rows[0]);

          if (gmailAccount) {
            // Check if calendar account exists and insert it immediately so that it is committed and visible to the key managers
            const existingCalendarAccount = await db
              .select()
              .from(corsairAccounts)
              .where(
                and(
                  eq(corsairAccounts.tenantId, tenantId),
                  eq(corsairAccounts.integrationId, calendarIntegration.id)
                )
              )
              .then((rows) => rows[0]);

            if (!existingCalendarAccount) {
              try {
                await db.insert(corsairAccounts).values({
                  id: crypto.randomUUID(),
                  tenantId,
                  integrationId: calendarIntegration.id,
                  config: {},
                  dek: gmailAccount.dek,
                });
              } catch (insertErr) {
                console.warn('[OAuth Callback] Calendar account insert race warning:', insertErr);
              }
            }
          }

          // Now instantiate the account key managers to copy tokens
          const gmailAccountKm = createAccountKeyManager({
            authType: "oauth_2",
            integrationName: 'gmail',
            tenantId,
            kek,
            database
          });

          const calendarAccountKm = createAccountKeyManager({
            authType: "oauth_2",
            integrationName: 'googlecalendar',
            tenantId,
            kek,
            database
          });

          const gAccessToken = await gmailAccountKm.get_access_token();
          const gRefreshToken = await gmailAccountKm.get_refresh_token();
          const gExpiresAt = await gmailAccountKm.get_expires_at();

          if (gAccessToken) await calendarAccountKm.set_access_token(gAccessToken);
          if (gRefreshToken) await calendarAccountKm.set_refresh_token(gRefreshToken);
          if (gExpiresAt) await calendarAccountKm.set_expires_at(gExpiresAt);

          console.log(`[OAuth Callback] Successfully duplicated Google tokens from Gmail account to Google Calendar account for tenant: ${tenantId}`);

          // --- REGISTER GOOGLE CALENDAR WEBHOOK WATCH ---
          try {
            const calendarIntegrationKm = createIntegrationKeyManager({
              authType: "oauth_2",
              integrationName: 'googlecalendar',
              kek,
              database
            });

            const calendarClientId = await calendarIntegrationKm.get_client_id();
            const calendarClientSecret = await calendarIntegrationKm.get_client_secret();

            if (calendarClientId && calendarClientSecret && gRefreshToken) {
              console.log(`[OAuth Callback] Registering Calendar watch for tenant: ${tenantId} directly from Gmail flow`);
              
              const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                  client_id: calendarClientId,
                  client_secret: calendarClientSecret,
                  refresh_token: gRefreshToken,
                  grant_type: "refresh_token"
                })
              });

              if (tokenRes.ok) {
                const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
                const accessToken = tokenData.access_token;
                const webhookUrl = `${origin}/api/corsair?tenantId=${tenantId}`;
                const channelId = crypto.randomUUID();

                const watchRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events/watch", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    id: channelId,
                    type: "web_hook",
                    address: webhookUrl
                  })
                });

                if (watchRes.ok) {
                  const watchData = (await watchRes.json()) as GoogleWatchResponse;
                  // Save channel ID and resource ID for cancellation
                  await (calendarAccountKm as any).set_calendar_watch_channel_id(channelId);
                  if (watchData.resourceId) {
                    await (calendarAccountKm as any).set_calendar_watch_resource_id(watchData.resourceId);
                  }
                  console.log(`[OAuth Callback] Calendar watch registered successfully from Gmail flow for tenant: ${tenantId}. Channel: ${channelId}. Expiration: ${new Date(Number(watchData.expiration)).toISOString()}`);
                } else {
                  const errText = await watchRes.text();
                  console.error(`[OAuth Callback] Calendar watch API call failed in Gmail flow: ${errText}`);
                }
              } else {
                const errText = await tokenRes.text();
                console.error(`[OAuth Callback] Failed to refresh Calendar access token in Gmail flow: ${errText}`);
              }
            }
          } catch (calWatchErr) {
            console.error('[OAuth Callback] Error registering Calendar watch inside Gmail callback flow:', calWatchErr);
          }
        }
      } catch (watchErr) {
        console.error('[OAuth Callback] Error during automated Gmail watch/Calendar sync registration:', watchErr);
      }
    }

    // Automatically register Google Calendar webhook watch subscription if user connected their Calendar account
    if (plugin === 'googlecalendar') {
      try {
        const kek = process.env.CORSAIR_KEK!;
        const databaseInternal = (corsair as { [key: symbol]: { database?: CorsairDatabase } | undefined })[Symbol.for("corsair:internal")]?.database;
        const database = databaseInternal || createCorsairDatabase(pool);

        const integrationKm = createIntegrationKeyManager({
          authType: "oauth_2",
          integrationName: 'googlecalendar',
          kek,
          database
        });

        const accountKm = createAccountKeyManager({
          authType: "oauth_2",
          integrationName: 'googlecalendar',
          tenantId,
          kek,
          database
        });

        const clientId = await integrationKm.get_client_id();
        const clientSecret = await integrationKm.get_client_secret();
        const refreshToken = await accountKm.get_refresh_token();

        if (clientId && clientSecret && refreshToken) {
          console.log(`[OAuth Callback] Refreshing Calendar access token for tenant: ${tenantId}`);
          
          // 1. Refresh Google access token
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: "refresh_token"
            })
          });

          if (tokenRes.ok) {
            const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
            const accessToken = tokenData.access_token;

            const originUrl = origin;
            const webhookUrl = `${originUrl}/api/corsair?tenantId=${tenantId}`;
            const channelId = crypto.randomUUID();

            console.log(`[OAuth Callback] Registering Calendar watch for tenant: ${tenantId} on webhook: ${webhookUrl}`);
            
            // 2. Call Google Calendar Watch API
            const watchRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events/watch", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                id: channelId,
                type: "web_hook",
                address: webhookUrl
              })
            });

            if (watchRes.ok) {
              const watchData = (await watchRes.json()) as GoogleWatchResponse;
              // Save channel ID and resource ID for cancellation
              await (accountKm as any).set_calendar_watch_channel_id(channelId);
              if (watchData.resourceId) {
                await (accountKm as any).set_calendar_watch_resource_id(watchData.resourceId);
              }
              console.log(`[OAuth Callback] Calendar watch registered successfully for user ${tenantId}. Channel ID: ${channelId}. Expiration: ${new Date(Number(watchData.expiration)).toISOString()}`);
            } else {
              const errText = await watchRes.text();
              console.error(`[OAuth Callback] Calendar watch API call failed: ${errText}`);
            }
          } else {
            const errText = await tokenRes.text();
            console.error(`[OAuth Callback] Failed to refresh access token for Calendar watch: ${errText}`);
          }
        } else {
          console.warn(`[OAuth Callback] Missing credentials for Calendar watch setup (clientId: ${!!clientId}, clientSecret: ${!!clientSecret}, refreshToken: ${!!refreshToken})`);
        }
      } catch (watchErr) {
        console.error('[OAuth Callback] Error during automated Calendar watch registration:', watchErr);
      }
    }

    return NextResponse.redirect(`${origin}/onboarding`);
  } catch (error: unknown) {
    console.error('Error in OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to exchange token';
    // Redirect to onboarding with an error query param
    return NextResponse.redirect(
      `${origin}/onboarding?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
