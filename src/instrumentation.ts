export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return;
  }

  const { ensureGoogleCredentialsSynced } = await import('../corsair');

  try {
    await ensureGoogleCredentialsSynced();
    console.log('[Corsair Init] Google OAuth credentials synced from env on server startup');
  } catch (err) {
    console.error('[Corsair Init] Failed to sync Google OAuth credentials on startup:', err);
  }
}
