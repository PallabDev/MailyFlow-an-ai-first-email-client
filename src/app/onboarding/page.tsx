import { auth, currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Mail, Calendar, Sparkles, Lock, Link as LinkIcon } from 'lucide-react';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=' + encodeURIComponent('/onboarding'));
  }

  const user = await currentUser();
  const resolvedSearchParams = await searchParams;
  const oauthError = resolvedSearchParams.error;

  // Query database to see what's connected for this user
  let connectedAccounts: any[] = [];
  let dbError = false;
  try {
    connectedAccounts = await db
      .select({
        name: corsairIntegrations.name,
        tenantId: corsairAccounts.tenantId,
        config: corsairAccounts.config,
      })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(
        eq(corsairAccounts.tenantId, userId)
      );
  } catch (err) {
    console.error("Database connection/quota error on onboarding page:", err);
    dbError = true;
  }

  const isGmailConnected = connectedAccounts.some((acc) => acc.name === 'gmail' && (acc.config as any)?.access_token);
  const isCalendarConnected = connectedAccounts.some((acc) => acc.name === 'googlecalendar' && (acc.config as any)?.access_token);
  const isGoogleConnected = isGmailConnected && isCalendarConnected;
  const allConnected = isGoogleConnected || dbError;

  // Redirect directly to the dashboard/mail page if successfully connected
  if (allConnected) {
    redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-text-primary antialiased font-sans">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-success/5 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-sidebar-border bg-card px-6 py-4 backdrop-blur-md shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-accent via-success to-accent-glow bg-clip-text text-transparent">
            MailyFlow
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-text-secondary hidden sm:inline">{user?.emailAddresses[0]?.emailAddress}</span>
          <UserButton />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary leading-tight">
              Connect your Google accounts
            </h1>
            <p className="text-text-secondary text-sm md:text-base max-w-md mx-auto">
              Connect Gmail and Google Calendar to let AI help you manage your email and schedule.
            </p>
          </div>

          {oauthError && (
            <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 text-danger text-sm text-center font-medium animate-in fade-in duration-200">
              ⚠️ {oauthError}
            </div>
          )}

          {/* Clean White Reference Card */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col space-y-8 items-center text-text-primary">
            
            {/* Google Logos side by side with link icon in the middle */}
            <div className="flex items-center justify-center space-x-4 py-2">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center border border-border shadow-sm">
                <svg className="h-7 w-7" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#ea4335" />
                  <path d="M22 6c0-.5-.2-1-.5-1.3L12 13 2.5 4.7C2.2 5 2 5.5 2 6v1l10 8 10-8V6z" fill="#FBBC05" />
                  <path d="M2 6v12c0 1.1.9 2 2 2h4V8L2 6z" fill="#34A853" />
                  <path d="M22 6v12c0 1.1-.9 2-2 2h-4V8l6-2z" fill="#4285F4" />
                </svg>
              </div>
              <div className="h-8 w-8 rounded-full border border-border bg-background flex items-center justify-center text-text-muted text-xs shadow-sm">
                <LinkIcon className="h-4 w-4" />
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center border border-border shadow-sm">
                <svg className="h-7 w-7" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="4" fill="#4285f4" />
                  <path d="M6 6h12v12H6V6z" fill="#ffffff" />
                  <text x="12" y="15" fill="#4285f4" fontSize="9" fontWeight="bold" textAnchor="middle">31</text>
                </svg>
              </div>
            </div>

            {/* List of Features */}
            <div className="w-full space-y-5">
              <div className="flex items-start space-x-3.5">
                <div className="h-8 w-8 rounded-lg bg-surface-subtle flex items-center justify-center text-text-secondary shrink-0 mt-0.5">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-sm leading-tight">Read, write, and organize emails</h3>
                  <p className="text-text-muted text-xs mt-1 leading-relaxed">
                    Summarize threads, draft replies, and stay on top of your inbox.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="h-8 w-8 rounded-lg bg-surface-subtle flex items-center justify-center text-text-secondary shrink-0 mt-0.5">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-sm leading-tight">Manage your schedule</h3>
                  <p className="text-text-muted text-xs mt-1 leading-relaxed">
                    Create events, find time, and keep your day organized.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="h-8 w-8 rounded-lg bg-surface-subtle flex items-center justify-center text-text-secondary shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-sm leading-tight">AI that works for you</h3>
                  <p className="text-text-muted text-xs mt-1 leading-relaxed">
                    Ask questions, give commands, and get things done across your email and calendar.
                  </p>
                </div>
              </div>
            </div>

            {/* Large Prominent Connection Button */}
            <div className="w-full pt-2">
              <a
                href="/api/auth/connect?plugin=gmail"
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-black text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 px-6 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 text-center cursor-pointer"
              >
                {/* Google G logo */}
                <svg className="h-4.5 w-4.5 mr-1" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Connect Gmail & Google Calendar</span>
              </a>
            </div>

            {/* Lock Secure footer */}
            <div className="w-full flex items-center justify-center text-text-muted text-xs gap-1.5 pt-1">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure, private, and encrypted</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
