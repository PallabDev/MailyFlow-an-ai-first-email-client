import { auth, currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/utils/corsair';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { Mail, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  const resolvedSearchParams = await searchParams;
  const oauthError = resolvedSearchParams.error;

  // Query database to see what's connected for this user OR the 'dev' tenant
  const connectedAccounts = await db
    .select({
      name: corsairIntegrations.name,
      tenantId: corsairAccounts.tenantId,
      config: corsairAccounts.config,
    })
    .from(corsairAccounts)
    .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
    .where(
      or(
        eq(corsairAccounts.tenantId, userId),
        eq(corsairAccounts.tenantId, 'dev')
      )
    );

  const isGmailConnected = connectedAccounts.some((acc) => acc.name === 'gmail' && (acc.config as any)?.access_token);
  const isCalendarConnected = connectedAccounts.some((acc) => acc.name === 'googlecalendar' && (acc.config as any)?.access_token);
  const allConnected = isGmailConnected && isCalendarConnected;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-3xl animate-pulse delay-700"></div>

      {/* Header / Nav */}
      <header className="flex items-center justify-between border-b border-white/5 bg-slate-900/20 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AgentiFlow
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-400 hidden sm:inline">{user?.emailAddresses[0]?.emailAddress}</span>
          <UserButton />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Welcome, <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">{user?.firstName || 'User'}</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg">
              Let's connect your workspace accounts to bootstrap your integrations and prepare your AI workflows.
            </p>
          </div>

          {oauthError && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm max-w-md mx-auto text-center">
              ⚠️ {oauthError}
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gmail Integration Card */}
            <div className={`relative overflow-hidden rounded-2xl border bg-slate-900/40 p-8 backdrop-blur-xl transition-all duration-300 ${
              isGmailConnected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 hover:border-indigo-500/30'
            }`}>
              <div className="absolute top-0 right-0 -z-10 h-32 w-32 bg-gradient-to-bl from-red-500/5 to-transparent blur-xl"></div>
              
              <div className="flex flex-col h-full justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>Google Mail</span>
                      {isGmailConnected && <span className="text-emerald-400 text-xs font-normal bg-emerald-500/10 px-2 py-0.5 rounded-full">Connected</span>}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Sync your emails, drafts, and allow your agent to help organize your inbox.
                    </p>
                  </div>
                </div>

                <div>
                  {isGmailConnected ? (
                    <div className="flex items-center space-x-2 text-emerald-400 font-medium">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Gmail authorized</span>
                    </div>
                  ) : (
                    <a
                      href="/api/auth/connect?plugin=gmail"
                      className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95"
                    >
                      <span>Connect Google Mail</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Google Calendar Card */}
            <div className={`relative overflow-hidden rounded-2xl border bg-slate-900/40 p-8 backdrop-blur-xl transition-all duration-300 ${
              isCalendarConnected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 hover:border-indigo-500/30'
            }`}>
              <div className="absolute top-0 right-0 -z-10 h-32 w-32 bg-gradient-to-bl from-blue-500/5 to-transparent blur-xl"></div>

              <div className="flex flex-col h-full justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>Google Calendar</span>
                      {isCalendarConnected && <span className="text-emerald-400 text-xs font-normal bg-emerald-500/10 px-2 py-0.5 rounded-full">Connected</span>}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Manage your events, calendars, scheduling times, and track meetings.
                    </p>
                  </div>
                </div>

                <div>
                  {isCalendarConnected ? (
                    <div className="flex items-center space-x-2 text-emerald-400 font-medium">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Calendar authorized</span>
                    </div>
                  ) : (
                    <a
                      href="/api/auth/connect?plugin=googlecalendar"
                      className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95"
                    >
                      <span>Connect Google Calendar</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Continue Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-white text-sm sm:text-base">Onboarding Status</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                {allConnected
                  ? "All integrations active. You're ready to proceed!"
                  : "Connect both services to unlock the full workflow dashboard."}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!allConnected && (
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Bypass (Developer Mode)
                </Link>
              )}
              <Link
                href="/dashboard"
                className={`inline-flex items-center space-x-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                  allConnected
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:scale-105 hover:shadow-purple-500/35 active:scale-95'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5'
                }`}
                aria-disabled={!allConnected}
                tabIndex={allConnected ? undefined : -1}
                onClick={allConnected ? undefined : (e) => e.preventDefault()}
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
