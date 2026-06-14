import { Sparkles, ArrowRight, ShieldCheck, Mail, Calendar, Lock } from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

export default function HowItWorks() {
  return (
    <section className="py-24 md:py-32">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow-dash {
          stroke-dasharray: 6, 4;
          animation: flowDash 1.2s linear infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2.5s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.08); }
        }
      `}} />

      <Container className="flex flex-col gap-16">
        <SectionHeading
          eyebrow="How it works"
          title="Architecture built for outcomes and trust."
          subtitle="Discover how MailyFlow translates your instructions into secure API interactions without risking your credentials."
        />

        <div className="grid gap-8 md:grid-cols-2">
          {/* Card 1: AI Orchestration Flow */}
          <Reveal className="group relative rounded-2xl border border-line bg-surface2/30 hover:bg-surface2/45 p-6 md:p-8 flex flex-col gap-6 transition-all duration-300 hover:shadow-md">
            {/* Top Info */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-accent-ink tracking-widest uppercase">AI Orchestration</span>
                <h3 className="font-display text-lg font-semibold tracking-tight text-text mt-1">
                  Translate intent to workspace actions
                </h3>
              </div>
              <ArrowRight size={16} className="text-muted group-hover:text-text group-hover:translate-x-1 transition-all" />
            </div>

            {/* Diagram Panel */}
            <div className="flex flex-col items-center bg-surface border border-line-strong rounded-xl p-6 h-[290px] justify-between relative overflow-hidden select-none">
              {/* User Prompt Box */}
              <div className="border border-line bg-surface2 px-3 py-1.5 rounded-lg text-[10.5px] font-medium text-text shadow-sm inline-flex items-center gap-1.5 max-w-[250px] z-10">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse shrink-0" />
                <span className="truncate">"Draft a reply to Google and book team meeting"</span>
              </div>

              {/* Vertical Line to AI Brain */}
              <svg className="w-full h-8 text-accent/50 dark:text-accent/35" preserveAspectRatio="none">
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
              </svg>

              {/* Central AI Brain Node */}
              <div className="relative flex items-center justify-center z-10">
                {/* Glow ring */}
                <div className="animate-pulse-glow absolute h-16 w-16 rounded-full bg-accent/30 blur-md" />
                <div className="relative h-12 w-12 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_0_15px_var(--glow)] border border-white/10 shrink-0">
                  <Sparkles size={18} />
                </div>
                
                {/* Side annotations */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-surface border border-line px-2 py-0.5 rounded text-[8.5px] font-semibold text-muted shadow-sm whitespace-nowrap">
                  🧠 Intent Parser
                </div>
                <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-surface border border-line px-2 py-0.5 rounded text-[8.5px] font-semibold text-muted shadow-sm whitespace-nowrap">
                  ⚙️ Tool Calling
                </div>
              </div>

              {/* Splitting Orthogonal Line */}
              <svg className="w-full h-8 text-accent/50 dark:text-accent/35" preserveAspectRatio="none">
                <line x1="50%" y1="0" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
                <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
                <line x1="25%" y1="50%" x2="25%" y2="100%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
                <line x1="75%" y1="50%" x2="75%" y2="100%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
              </svg>

              {/* Destination nodes */}
              <div className="flex gap-4 w-full justify-center z-10">
                <div className="flex items-center gap-1.5 border border-line bg-surface2 px-2.5 py-1.5 rounded-lg text-[9.5px] text-muted font-medium w-[125px] shadow-sm">
                  <Mail size={11} className="text-accent shrink-0" />
                  <span className="truncate">Draft reply (Gmail)</span>
                </div>
                <div className="flex items-center gap-1.5 border border-line bg-surface2 px-2.5 py-1.5 rounded-lg text-[9.5px] text-muted font-medium w-[125px] shadow-sm">
                  <Calendar size={11} className="text-accent shrink-0" />
                  <span className="truncate">Book slot (Calendar)</span>
                </div>
              </div>
            </div>

            {/* Feature Details list */}
            <div className="flex flex-col gap-3.5 text-muted mt-2">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-ink text-[10px] font-bold">1</span>
                <p className="text-sm"><strong>Natural Prompting:</strong> Describe outcomes in plain language. The AI parses the context, understands intent, and maps it to specific API instructions.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-ink text-[10px] font-bold">2</span>
                <p className="text-sm"><strong>Approval Checkpoint:</strong> Prepared changes are loaded as staging drafts. No email is sent or event finalized without your manual review.</p>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Secure Sandbox Vault */}
          <Reveal delay={150} className="group relative rounded-2xl border border-line bg-surface2/30 hover:bg-surface2/45 p-6 md:p-8 flex flex-col gap-6 transition-all duration-300 hover:shadow-md">
            {/* Top Info */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-accent-ink tracking-widest uppercase">Security Gateway</span>
                <h3 className="font-display text-lg font-semibold tracking-tight text-text mt-1">
                  Execute operations within a sandboxed vault
                </h3>
              </div>
              <ArrowRight size={16} className="text-muted group-hover:text-text group-hover:translate-x-1 transition-all" />
            </div>

            {/* Diagram Panel */}
            <div className="flex flex-col items-center bg-surface border border-line-strong rounded-xl p-6 h-[290px] justify-between relative overflow-hidden select-none">
              {/* API Sources */}
              <div className="flex gap-4 w-full justify-center z-10">
                <div className="flex items-center gap-1.5 border border-line bg-surface2 px-2.5 py-1.5 rounded-lg text-[9.5px] text-muted font-medium w-[110px] shadow-sm">
                  <Mail size={11} className="text-zinc-400 shrink-0" />
                  <span>Gmail API</span>
                </div>
                <div className="flex items-center gap-1.5 border border-line bg-surface2 px-2.5 py-1.5 rounded-lg text-[9.5px] text-muted font-medium w-[110px] shadow-sm">
                  <Calendar size={11} className="text-zinc-400 shrink-0" />
                  <span>Calendar API</span>
                </div>
              </div>

              {/* Vertical Branching Downward Lines */}
              <svg className="w-full h-8 text-emerald-500/40 dark:text-emerald-400/30" preserveAspectRatio="none">
                <line x1="25%" y1="0" x2="25%" y2="50%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
                <line x1="75%" y1="0" x2="75%" y2="50%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
                <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
                <line x1="50%" y1="50%" x2="50%" y2="100%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
              </svg>

              {/* Central Lock / Gateway Node */}
              <div className="relative flex items-center justify-center z-10">
                {/* Glow ring */}
                <div className="animate-pulse-glow absolute h-16 w-16 rounded-full bg-emerald-500/20 blur-md" />
                <div className="relative h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-sm shrink-0">
                  <Lock size={18} />
                </div>
                
                {/* Side annotations */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-surface border border-line px-2 py-0.5 rounded text-[8.5px] font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm whitespace-nowrap">
                  🔑 Scoped OAuth
                </div>
                <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-surface border border-line px-2 py-0.5 rounded text-[8.5px] font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm whitespace-nowrap">
                  🔒 Encrypted Vault
                </div>
              </div>

              {/* Vertical Downward line */}
              <svg className="w-full h-8 text-emerald-500/40 dark:text-emerald-400/30" preserveAspectRatio="none">
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="1.5" className="animate-flow-dash" />
              </svg>

              {/* Destination Client App */}
              <div className="border border-line bg-surface2 px-3 py-1.5 rounded-lg text-[10.5px] font-semibold text-text shadow-sm inline-flex items-center gap-1.5 max-w-[200px] z-10">
                <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                <span>MailyFlow Sandbox</span>
              </div>
            </div>

            {/* Feature Details list */}
            <div className="flex flex-col gap-3.5 text-muted mt-2">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-ink text-[10px] font-bold">1</span>
                <p className="text-sm"><strong>Zero-Trust Sandboxing:</strong> All operational API tokens are encrypted with AES-256 and stored in an isolated database environment, preventing credential leaks.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-ink text-[10px] font-bold">2</span>
                <p className="text-sm"><strong>OAuth Access Control:</strong> MailyFlow operates via official, scoped OAuth 2.0 endpoints. You remain the sole owner of your access privileges.</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom trust note */}
        <Reveal delay={200} y={16}>
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-muted">
              <ShieldCheck size={13} strokeWidth={2} className="text-accent-ink shrink-0" />
              OAuth 2.0 secured · Read-only by default · You approve every action
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
