import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  Sparkles,
  Inbox,
  Calendar,
  Check,
  CornerUpLeft,
  Search,
  Moon,
  Sun,
  Mail,
  FileText,
  Send,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw
} from "lucide-react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import Reveal from "../ui/Reveal";
import { useTheme } from "../../theme";

const EMAILS = [
  {
    sender: "Google",
    date: "14/06/2026 with 11:25 pm",
    subject: "Security alert",
    snippet: "You allowed mailyflow.in access to some of your Google...",
    unread: true,
  },
  {
    sender: "Google",
    date: "14/06/2026 with 11:25 pm",
    subject: "Security alert",
    snippet: "You allowed mailyflow.in access to some of your Google...",
    unread: true,
  },
  {
    sender: "MailyFlow",
    date: "14/06/2026 with 11:25 pm",
    subject: "New device signed in to your MailyFlow account",
    snippet: "New sign in to your...",
    unread: true,
  },
  {
    sender: "Google",
    date: "14/06/2026 with 10:36 pm",
    subject: "You shared some Google Account data with mailyflow.in",
    snippet: "Keep track...",
    unread: false,
  },
  {
    sender: "Pallab Karmakar",
    date: "14/06/2026 with 02:51 am",
    subject: "Invitation from an unknown sender: Meeting with nroynibedita02 @ S...",
    snippet: "Invitation from...",
    unread: false,
  },
  {
    sender: "Pallab Karmakar",
    date: "14/06/2026 with 02:51 am",
    subject: "Meeting today at 9 AM",
    snippet: "Hi, I scheduled a meeting today at 9:00 AM...",
    unread: false,
  },
];

const getInitials = (sender: string) => {
  if (sender === "Google") return "GO";
  if (sender === "MailyFlow") return "MA";
  if (sender === "Pallab Karmakar") return "PK";
  return sender.slice(0, 2).toUpperCase();
};

const getInitialsStyles = (sender: string) => {
  if (sender === "Google") return "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50";
  if (sender === "MailyFlow") return "bg-red-500/10 text-red-500 dark:text-red-400";
  return "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50";
};

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
      {/* ambient backdrop */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-[0.5]" />
      <div
        aria-hidden
        className="animate-glow absolute -top-20 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }}
      />

      <Container className="flex flex-col items-center text-center gap-14 max-w-5xl">
        {/* Centered Content Block */}
        <div className="flex flex-col items-center gap-7 max-w-3xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-accent-ink">
              <Sparkles size={13} strokeWidth={2} />
              Your AI employee for email & calendar
            </span>
          </Reveal>
          
          <Reveal delay={90}>
            <h1 className="font-display text-[44px] font-semibold leading-[1.04] tracking-tight text-text sm:text-6xl md:text-[68px] max-w-2xl">
              Your Inbox Can{" "}
              <span className="relative whitespace-nowrap text-accent-ink">
                Work For You
                <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none" preserveAspectRatio="none">
                  <path d="M2 7C50 2 150 2 198 7" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>
          </Reveal>
          
          <Reveal delay={170}>
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              Connect Gmail and Calendar. Describe what you want in plain language. MailyFlow executes the work — and waits for your approval.
            </p>
          </Reveal>
          
          <Reveal delay={250}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/sign-up">
                <Button variant="primary" glow magnetic className="px-6 py-3 text-[15px]">
                  Start Free <ArrowRight size={16} strokeWidth={2} />
                </Button>
              </Link>
              <Button variant="secondary" className="px-6 py-3 text-[15px]">
                <Play size={15} strokeWidth={2} /> Watch Demo
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Dashboard Preview - Center & Below */}
        <Reveal delay={200} className="w-full relative px-2">
          <div className="relative mx-auto w-full max-w-[1020px]">
            {/* Browser frame */}
            <div className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              {/* Browser control bar */}
              <div className="flex items-center justify-between border-b border-line bg-surface2/60 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="flex items-center gap-1.5 bg-surface border border-line rounded-md px-4 py-1 text-[10.5px] text-muted w-full max-w-[340px] justify-center select-none">
                  <span className="text-[9px] text-accent font-semibold">https://</span>
                  <span>mailyflow.in/dashboard/inbox</span>
                </div>
                <div className="w-12" /> {/* spacer */}
              </div>

              {/* Product preview layout */}
              <ProductPreview />
            </div>

            {/* Floating chips overlay - hidden on mobile */}
            <FloatChip
              className="animate-float -left-12 top-16 hidden md:flex"
              icon={<CornerUpLeft size={14} strokeWidth={2} />}
              title="Smart reply drafted"
              sub="Re: Q3 investor update"
              tone="accent"
            />
            <FloatChip
              className="animate-float-lg -right-12 top-44 hidden md:flex"
              icon={<Calendar size={14} strokeWidth={2} />}
              title="Meeting scheduled"
              sub="Tue 3:00 PM · 5 invitees"
              tone="primary"
            />
            <FloatChip
              className="animate-float -bottom-8 left-24 hidden md:flex"
              icon={<Check size={14} strokeWidth={2.4} />}
              title="Inbox triaged"
              sub="12 emails sorted"
              tone="accent"
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function ProductPreview() {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col bg-surface">
      {/* Dashboard Top Header Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-line bg-surface">
        {/* Left */}
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-[11px] text-muted border border-line bg-surface2 px-2 py-0.5 rounded cursor-pointer hover:bg-line/20">&lt;</span>
        </div>
        
        {/* Middle Search & User Controls */}
        <div className="flex items-center gap-4 flex-1 max-w-[380px] mx-auto px-4">
          <div className="flex items-center gap-2 bg-surface2 border border-line rounded-lg px-3 py-1.5 flex-1 text-[11.5px] text-muted select-none">
            <Search size={12} className="opacity-60" />
            <span className="truncate">Search mail, events, people...</span>
            <span className="ml-auto text-[9px] border border-line bg-surface px-1.5 py-0.5 rounded font-mono">⌘K</span>
          </div>
          {isDark ? (
            <Sun size={13} className="text-muted hover:text-text cursor-pointer transition-colors" />
          ) : (
            <Moon size={13} className="text-muted hover:text-text cursor-pointer transition-colors" />
          )}
          <span className="h-6 w-6 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-[11px] shrink-0 select-none">N</span>
        </div>
        
        {/* Right */}
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-[11px] text-muted border border-line bg-surface2 px-2 py-0.5 rounded cursor-pointer hover:bg-line/20">&gt;</span>
        </div>
      </div>

      {/* Main Workspace layout */}
      <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] lg:grid-cols-[170px_1fr_240px] h-[500px] overflow-hidden bg-surface text-text">
        {/* 1. Left Sidebar */}
        <div className="hidden md:flex flex-col border-r border-line bg-surface2/60 p-4 text-left h-full overflow-y-auto">
          <div className="flex flex-col gap-6">
            {/* Mail section */}
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2.5 px-2 select-none">Mail</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2 text-[12px] font-semibold text-accent-ink">
                  <span className="flex items-center gap-2.5">
                    <Mail size={14} />
                    <span>Inbox</span>
                  </span>
                  <span className="text-[9.5px] bg-accent/20 px-1.5 py-0.5 rounded-full text-accent-ink font-bold">15</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted hover:bg-surface/50 transition-colors cursor-pointer">
                  <FileText size={14} />
                  <span>Drafts</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted hover:bg-surface/50 transition-colors cursor-pointer">
                  <Send size={14} />
                  <span>Sent</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted hover:bg-surface/50 transition-colors cursor-pointer">
                  <AlertCircle size={14} />
                  <span>Spam</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted hover:bg-surface/50 transition-colors cursor-pointer">
                  <Trash2 size={14} />
                  <span>Trash</span>
                </div>
              </div>
            </div>

            {/* Calendar section */}
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2.5 px-2 select-none">Calendar</p>
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted hover:bg-surface/50 transition-colors cursor-pointer">
                <Calendar size={14} />
                <span>Calendar</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Middle Panel (Email List) */}
        <div className="flex flex-col min-w-0 bg-surface h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-3 select-none">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-text">Inbox</span>
              <span className="text-muted text-[11px] hover:text-text cursor-pointer transition-colors"><RefreshCw size={11} /></span>
              <span className="text-[11px] text-muted">15 unread</span>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-[1.08] transition-all">
              <Plus size={11} strokeWidth={2.5} />
              <span>Compose</span>
            </button>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {EMAILS.map((e, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-line px-4.5 py-3.5 hover:bg-surface2/30 transition-colors cursor-pointer">
                {/* Initials & Unread status dot */}
                <div className="flex items-center gap-2 shrink-0">
                  {e.unread ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 shrink-0 opacity-0" />
                  )}
                  <div className={`h-7.5 w-7.5 rounded-full flex items-center justify-center text-[10px] font-bold ${getInitialsStyles(e.sender)} shrink-0`}>
                    {getInitials(e.sender)}
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 text-left text-[12px]">
                  <div className="flex items-center justify-between gap-2.5">
                    <span className={`truncate ${e.unread ? "font-semibold text-text" : "text-muted"}`}>{e.sender}</span>
                    <span className="shrink-0 text-[10px] text-muted">{e.date}</span>
                  </div>
                  <p className={`truncate mt-0.5 ${e.unread ? "font-medium text-text" : "text-muted"}`}>
                    {e.subject} <span className="text-muted font-normal">— {e.snippet}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Right Sidebar (AI Assistant Chat UI) */}
        <div className="hidden lg:flex flex-col border-l border-line bg-surface2/60 p-4 text-left h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between text-accent-ink font-semibold text-[13px] border-b border-line pb-2.5 mb-4 select-none">
            <span className="flex items-center gap-2">
              <Sparkles size={14} />
              <span>AI Assistant</span>
            </span>
            <span className="text-[10px] text-muted font-normal border border-line bg-surface px-1.5 py-0.5 rounded">&gt;</span>
          </div>

          {/* Assistant Center Banner */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-1.5">
            <div className="relative h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center mb-3.5 shrink-0 select-none">
              <Sparkles size={18} className="text-accent" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
            </div>
            <p className="text-[11.5px] text-muted leading-relaxed font-normal">
              Ask me anything about your emails, drafting answers, or scheduling calendar events!
            </p>
          </div>

          {/* AI Input placeholder */}
          <div className="mt-auto flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 select-none">
            <span className="text-[11px] text-muted flex-1">Ask anything...</span>
            <button className="h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-colors shrink-0">
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatChip({
  className,
  icon,
  title,
  sub,
  tone,
}: {
  className: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  tone: "accent" | "primary";
}) {
  return (
    <div
      className={`absolute flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 shadow-[0_16px_36px_-18px_rgba(17,24,39,0.35)] dark:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.6)] ${className}`}
      style={{ transform: "translateZ(50px)" }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
        style={{ background: tone === "accent" ? "var(--accent)" : "var(--primary)" }}
      >
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-semibold leading-tight text-text text-left">{title}</p>
        <p className="text-[10px] leading-tight text-muted text-left">{sub}</p>
      </div>
    </div>
  );
}
