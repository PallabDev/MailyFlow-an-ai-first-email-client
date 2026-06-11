import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Layers, ArrowRight, Shield, Zap, Database } from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Background glowing decorations */}
      <div className="absolute top-[-10%] right-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-3xl animate-pulse delay-1000"></div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 backdrop-blur-md bg-slate-950/20 sticky top-0 z-55">
        <div className="flex items-center space-x-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AgentiFlow
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/sign-in"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto space-y-16">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            <span>Version 1.0.0 Alpha</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Bootstrap and Orchestrate{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Integrations
            </span>{' '}
            at Scale
          </h1>

          <p className="text-slate-400 text-lg md:text-xl font-normal max-w-2xl mx-auto leading-relaxed">
            AgentiFlow links your LLMs and agents securely to Gmail, Google Calendar, and other APIs. Fully sandboxed, multi-tenant, and production-ready.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 text-base font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95 cursor-pointer"
            >
              <span>Build Integration Flow</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-slate-900/40 px-8 py-4 text-base font-semibold text-slate-300 hover:text-white hover:bg-slate-800/40 backdrop-blur-xl transition-all active:scale-95 cursor-pointer"
            >
              <span>Explore Demo Workspace</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-3 text-left w-full">
          {/* Card 1 */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl hover:border-indigo-500/20 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Clerk Multi-Tenancy</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Authenticate users securely with Clerk. Access tokens and refreshed credentials are isolated per user tenant.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl hover:border-purple-500/20 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Corsair Plugin Layer</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Unified interface for third-party endpoints. Let agents search, write, or list data safely without raw credential exposure.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl hover:border-pink-500/20 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Neon Database Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Integrations, tokens, histories, and webhook states are encrypted and stored in PostgreSQL with Drizzle ORM mapping.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500 border-t border-white/5 bg-slate-950/40 backdrop-blur-md">
        <p>© 2026 AgentiFlow. All rights reserved. Built using Next.js, Clerk, and Corsair.</p>
      </footer>
    </div>
  );
}
