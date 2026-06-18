export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const logger = (await import('./lib/logger')).default;

  // Validate environment variables on startup
  try {
    const { validateEnv } = await import('./lib/validation');
    validateEnv();
    logger.info('✅ [Startup] Environment variables validated successfully.');
  } catch (err) {
    logger.error('❌ [Startup] Environment validation crashed:', err);
    throw err;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return;
  }

  const { ensureGoogleCredentialsSynced } = await import('../corsair');

  try {
    await ensureGoogleCredentialsSynced();
    logger.info('[Corsair Init] Google OAuth credentials synced from env on server startup');
  } catch (err) {
    logger.error('[Corsair Init] Failed to sync Google OAuth credentials on startup:', err);
  }
}
