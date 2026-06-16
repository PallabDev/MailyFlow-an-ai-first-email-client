import { createAccountKeyManager, createIntegrationKeyManager } from 'corsair/core';
import { createCorsairDatabase } from 'corsair/db';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import crypto from 'crypto';
import { pool, db, corsair } from './../../corsair';

export * from './../../corsair';

export async function hasActiveConnection(userId: string, plugin: 'gmail' | 'googlecalendar'): Promise<boolean> {
  try {
    const rows = await db
      .select({
        config: corsairAccounts.config,
      })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          eq(corsairIntegrations.name, plugin)
        )
      )
      .limit(1);

    if (rows.length === 0) return false;
    const config = rows[0].config as any;
    return !!(config?.refresh_token || config?.access_token);
  } catch (error) {
    console.error(`Error checking connection for ${plugin}:`, error);
    return false;
  }
}

export async function renewWatchesIfNeeded(tenantId: string) {
  try {
    const kek = process.env.CORSAIR_KEK;
    if (!kek) return;

    const database = createCorsairDatabase(pool);

    // Check Gmail watch renewal
    const gmailConnected = await hasActiveConnection(tenantId, 'gmail');
    if (gmailConnected) {
      const accountKm = createAccountKeyManager({
        authType: "oauth_2",
        integrationName: 'gmail',
        tenantId,
        kek,
        database,
        extraAccountFields: ['gmail_watch_expiration']
      });

      const expiration = await (accountKm as any).get_gmail_watch_expiration();
      const now = Date.now();
      // Renew if expiration is missing, or expires in less than 2 days
      const shouldRenew = !expiration || (Number(expiration) - now) < 2 * 24 * 60 * 60 * 1000;

      if (shouldRenew) {
        console.log(`[Watch Renewal] Gmail watch needs renewal for tenant: ${tenantId}`);
        const integrationKm = createIntegrationKeyManager({
          authType: "oauth_2",
          integrationName: 'gmail',
          kek,
          database,
          extraIntegrationFields: ["topic_id"]
        });

        const clientId = await integrationKm.get_client_id();
        const clientSecret = await integrationKm.get_client_secret();
        const refreshToken = await accountKm.get_refresh_token();
        const topicId = (await (integrationKm as any).get_topic_id()) || process.env.TOPIC_ID;

        if (clientId && clientSecret && refreshToken && topicId) {
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
            const tokenData = await tokenRes.json() as any;
            const accessToken = tokenData.access_token;

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
              const watchData = await watchRes.json() as any;
              const newExpiration = watchData.expiration;
              await (accountKm as any).set_gmail_watch_expiration(String(newExpiration));
              console.log(`[Watch Renewal] Gmail watch successfully renewed for tenant: ${tenantId}`);
            }
          }
        }
      }
    }

    // Check Calendar watch renewal
    const calendarConnected = await hasActiveConnection(tenantId, 'googlecalendar');
    if (calendarConnected) {
      const accountKm = createAccountKeyManager({
        authType: "oauth_2",
        integrationName: 'googlecalendar',
        tenantId,
        kek,
        database,
        extraAccountFields: ['calendar_watch_expiration']
      });

      const expiration = await (accountKm as any).get_calendar_watch_expiration();
      const now = Date.now();
      const shouldRenew = !expiration || (Number(expiration) - now) < 2 * 24 * 60 * 60 * 1000;

      if (shouldRenew) {
        console.log(`[Watch Renewal] Calendar watch needs renewal for tenant: ${tenantId}`);
        const integrationKm = createIntegrationKeyManager({
          authType: "oauth_2",
          integrationName: 'googlecalendar',
          kek,
          database
        });

        const clientId = await integrationKm.get_client_id();
        const clientSecret = await integrationKm.get_client_secret();
        const refreshToken = await accountKm.get_refresh_token();

        if (clientId && clientSecret && refreshToken) {
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
            const tokenData = await tokenRes.json() as any;
            const accessToken = tokenData.access_token;
            const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
              const watchData = await watchRes.json() as any;
              const newExpiration = watchData.expiration;
              await (accountKm as any).set_calendar_watch_expiration(String(newExpiration));
              
              // Save channel ID and resource ID for cancellation
              await (accountKm as any).set_calendar_watch_channel_id(channelId);
              if (watchData.resourceId) {
                await (accountKm as any).set_calendar_watch_resource_id(watchData.resourceId);
              }
              
              console.log(`[Watch Renewal] Calendar watch successfully renewed for tenant: ${tenantId}`);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Watch Renewal] Error checking/renewing watches:', err);
  }
}

export async function stopWatchesForTenant(tenantId: string) {
  try {
    const kek = process.env.CORSAIR_KEK;
    if (!kek) return;

    const database = createCorsairDatabase(pool);

    // 1. Stop Gmail watch
    const gmailConnected = await hasActiveConnection(tenantId, 'gmail');
    if (gmailConnected) {
      const accountKm = createAccountKeyManager({
        authType: "oauth_2",
        integrationName: 'gmail',
        tenantId,
        kek,
        database
      });

      const integrationKm = createIntegrationKeyManager({
        authType: "oauth_2",
        integrationName: 'gmail',
        kek,
        database
      });

      const clientId = await integrationKm.get_client_id();
      const clientSecret = await integrationKm.get_client_secret();
      const refreshToken = await accountKm.get_refresh_token();

      if (clientId && clientSecret && refreshToken) {
        console.log(`[Watch Disconnect] Stopping Gmail watch for tenant: ${tenantId}`);
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
          const tokenData = await tokenRes.json() as any;
          const accessToken = tokenData.access_token;

          const stopRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/stop", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            }
          });

          if (stopRes.ok) {
            console.log(`[Watch Disconnect] Gmail watch successfully stopped for tenant: ${tenantId}`);
          } else {
            const errText = await stopRes.text();
            console.error(`[Watch Disconnect] Gmail watch stop API failed: ${errText}`);
          }
        }
      }
    }

    // 2. Stop Calendar watch
    const calendarConnected = await hasActiveConnection(tenantId, 'googlecalendar');
    if (calendarConnected) {
      const accountKm = createAccountKeyManager({
        authType: "oauth_2",
        integrationName: 'googlecalendar',
        tenantId,
        kek,
        database,
        extraAccountFields: ['calendar_watch_channel_id', 'calendar_watch_resource_id']
      });

      const channelId = await (accountKm as any).get_calendar_watch_channel_id();
      const resourceId = await (accountKm as any).get_calendar_watch_resource_id();

      if (channelId && resourceId) {
        const integrationKm = createIntegrationKeyManager({
          authType: "oauth_2",
          integrationName: 'googlecalendar',
          kek,
          database
        });

        const clientId = await integrationKm.get_client_id();
        const clientSecret = await integrationKm.get_client_secret();
        const refreshToken = await accountKm.get_refresh_token();

        if (clientId && clientSecret && refreshToken) {
          console.log(`[Watch Disconnect] Stopping Calendar watch for tenant: ${tenantId}`);
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
            const tokenData = await tokenRes.json() as any;
            const accessToken = tokenData.access_token;

            const stopRes = await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                id: channelId,
                resourceId: resourceId
              })
            });

            if (stopRes.ok) {
              console.log(`[Watch Disconnect] Calendar watch successfully stopped for tenant: ${tenantId}`);
            } else {
              const errText = await stopRes.text();
              console.error(`[Watch Disconnect] Calendar watch stop API failed: ${errText}`);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Watch Disconnect] Error stopping watches on disconnect:', err);
  }
}
