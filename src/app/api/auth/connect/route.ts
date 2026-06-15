import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { corsair, syncGoogleCredentialsFromEnv } from '@/utils/corsair';
import { generateOAuthUrl } from 'corsair/oauth';
import { ConnectPlaceholder } from './_types';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const plugin = searchParams.get('plugin');

    if (!plugin || (plugin !== 'gmail' && plugin !== 'googlecalendar')) {
      return NextResponse.json(
        { error: 'Invalid or missing plugin parameter. Must be "gmail" or "googlecalendar".' },
        { status: 400 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const redirectUri = `${origin}/api/auth/callback`;

    await syncGoogleCredentialsFromEnv();

    const { url } = await generateOAuthUrl(corsair, plugin, {
      tenantId: userId,
      redirectUri,
    });

    let finalUrl = url;
    if (plugin === 'gmail') {
      const parsedUrl = new URL(url);
      const existingScope = parsedUrl.searchParams.get('scope') || '';
      const googleCalendarScope = 'https://www.googleapis.com/auth/calendar';
      
      const scopeList = existingScope.split(' ');
      if (!scopeList.includes(googleCalendarScope)) {
        scopeList.push(googleCalendarScope);
      }
      
      parsedUrl.searchParams.set('scope', scopeList.join(' '));
      // Force prompt=consent and access_type=offline to guarantee refresh token is returned
      parsedUrl.searchParams.set('prompt', 'consent');
      parsedUrl.searchParams.set('access_type', 'offline');
      
      finalUrl = parsedUrl.toString();
    }

    return NextResponse.redirect(finalUrl);
  } catch (error: unknown) {
    console.error('Error in connect API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
