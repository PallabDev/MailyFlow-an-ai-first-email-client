import { NextRequest, NextResponse } from 'next/server';
import { corsair } from '@/utils/corsair';
import { processOAuthCallback } from 'corsair/oauth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
    }

    const redirectUri = `${new URL(req.url).origin}/api/auth/callback`;

    await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri,
    });

    return NextResponse.redirect(`${new URL(req.url).origin}/onboarding`);
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    // Redirect to onboarding with an error query param
    return NextResponse.redirect(
      `${new URL(req.url).origin}/onboarding?error=${encodeURIComponent(
        error.message || 'Failed to exchange token'
      )}`
    );
  }
}
