import { auth, currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { Mail, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { disconnectPlugin } from './actions';

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

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-text-primary antialiased font-sans">
      {/* Background Subtle Accent Gradients (Clipped locally to prevent scrollbars) */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-success/5 blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-sidebar-border bg-card px-6 py-4 backdrop-blur-md">
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
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
              Welcome, <span className="bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">{user?.firstName || 'User'}</span>
            </h1>
            <p className="text-text-secondary text-base md:text-lg">
              Let's connect your workspace accounts to bootstrap your integrations and prepare your AI workflows.
            </p>
          </div>

          {dbError && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-sm max-w-md mx-auto text-center font-medium">
              ⚠️ Database storage quota exceeded. Running in offline/fallback mode. You can still continue to the dashboard.
            </div>
          )}

          {oauthError && (
            <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 text-danger text-sm max-w-md mx-auto text-center font-medium">
              ⚠️ {oauthError}
            </div>
          )}

          {/* Cards Grid */}
          <div className="max-w-xl mx-auto w-full">
            {/* Google Workspace Card */}
            <div className={`relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 ${
              isGoogleConnected ? 'border-success/30 bg-success/5' : 'border-border bg-card hover:border-accent/30'
            }`}>
              <div className="flex flex-col h-full justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary flex items-center space-x-2">
                      <span>Google Workspace</span>
                      {isGoogleConnected && <span className="text-success text-xs font-semibold bg-success/10 px-2 py-0.5 rounded-full">Connected</span>}
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                      Connect your Google Account to authorize MailyFlow to sync your emails, drafts, and calendar events. This enables your AI assistant to draft emails and schedule calendar meetings.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {isGoogleConnected ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2 text-success font-semibold">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Google account authorized</span>
                      </div>
                      <form action={disconnectPlugin.bind(null, 'gmail')}>
                        <button
                          type="submit"
                          className="rounded-lg border border-danger/25 text-danger hover:bg-danger/10 px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
                        >
                          Disconnect
                        </button>
                      </form>
                    </div>
                  ) : (
                    <a
                      href="/api/auth/connect?plugin=gmail"
                      className="inline-flex items-center space-x-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent/90 hover:shadow-sm active:scale-95"
                    >
                      <span>Connect Google Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Continue Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-text-primary text-sm sm:text-base">Onboarding Status</h3>
              <p className="text-xs sm:text-sm text-text-secondary">
                {allConnected
                  ? "All integrations active. You're ready to proceed!"
                  : "Connect both services to unlock the full workflow dashboard."}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {allConnected ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-accent via-success to-accent text-white px-6 py-3 text-sm font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <div
                  className="inline-flex items-center space-x-2 rounded-xl bg-surface-subtle text-text-muted border border-border px-6 py-3 text-sm font-semibold cursor-not-allowed"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
