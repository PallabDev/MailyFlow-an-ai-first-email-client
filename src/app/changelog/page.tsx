"use client";

import Navbar from "../../components/sections/Navbar";
import Footer from "../../components/sections/Footer";
import Container from "../../components/ui/Container";
import GlassCard from "../../components/ui/GlassCard";
import { ThemeProvider } from "../../theme";
import { Sparkles, Calendar, Mail, Search, Clock, Bot, ShieldCheck, Play } from "lucide-react";

interface ReleaseItem {
  version: string;
  date: string;
  title: string;
  badge: string;
  changes: {
    icon: any;
    title: string;
    description: string;
  }[];
}

const RELEASES: ReleaseItem[] = [
  {
    version: "v1.0.0",
    date: "June 15, 2026",
    title: "The Initial Launch — Autopilot for Email & Calendar",
    badge: "Major Release",
    changes: [
      {
        icon: Mail,
        title: "Unified Gmail Client Interface",
        description: "Browse, label, compose, send, and search your Gmail inbox within a high-performance unified mail feed designed for professional operators.",
      },
      {
        icon: Calendar,
        title: "Interactive Monthly Calendar Sync",
        description: "A full-featured Monthly Calendar Grid. Sync events in real-time, click slots to book meetings, resolve scheduling conflicts, and manage details.",
      },
      {
        icon: Bot,
        title: "MCP-Powered AI Co-pilot",
        description: "Your workspace assistant has direct action bindings to Gmail and Calendar. Integrates with the Model Context Protocol (MCP) to read threads, formulate replies, and arrange meetings.",
      },
      {
        icon: Search,
        title: "AI Semantic Search Engine",
        description: "Find documents, invoices, or customer details inside your emails using conversational queries like 'Stripe payouts from last Tuesday'. Searches by meaning, not just exact keywords.",
      },
      {
        icon: Clock,
        title: "Live Webhook Sync Streams",
        description: "Immediate data push updates using Google cloud webhooks. Incoming mail and calendar modifications display on your dashboard instantly without manual refreshes.",
      },
      {
        icon: ShieldCheck,
        title: "Zero-Trust Draft Staging Sandbox",
        description: "Full security controls. The AI Co-pilot drafts responses, schedules meetings, and organizes sequences, but everything is staged in a sandbox drawer. Nothing goes out without your manual confirmation.",
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <ThemeProvider>
      <div className="relative">
        <Navbar />
        <main className="pt-28 pb-16 md:pt-36 md:pb-24">
          <Container className="max-w-4xl flex flex-col gap-10">
            {/* Header section */}
            <div className="text-center md:text-left flex flex-col gap-3">
              <span className="w-fit self-center md:self-start inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-ink border border-accent/20">
                <Sparkles size={12} /> What&apos;s New
              </span>
              <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                Changelog
              </h1>
              <p className="text-sm md:text-base text-text-muted max-w-xl">
                Track releases, new features, and technical updates as we build the future of AI-first workspace management.
              </p>
            </div>

            {/* Releases list */}
            <div className="flex flex-col gap-12 relative border-l border-line pl-6 ml-4">
              {RELEASES.map((release) => (
                <div key={release.version} className="relative flex flex-col gap-6">
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-bg border border-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  </span>

                  {/* Release header info */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg font-bold text-text-primary">
                      {release.version}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({release.date})
                    </span>
                    <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success border border-success/20">
                      {release.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-text-primary">
                    {release.title}
                  </h3>

                  {/* Changes Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {release.changes.map((change, i) => {
                      const Icon = change.icon;
                      return (
                        <GlassCard key={i} className="p-5 flex gap-4 text-left select-none">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface2 border border-line">
                            <Icon size={16} className="text-accent-ink" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-semibold text-text-primary leading-tight">
                              {change.title}
                            </h4>
                            <p className="text-xs leading-relaxed text-text-muted">
                              {change.description}
                            </p>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
