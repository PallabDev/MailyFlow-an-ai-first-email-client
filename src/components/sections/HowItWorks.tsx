"use client";

import { ArrowRight, ShieldCheck, Mail, Calendar, Key, Layout, Bot } from "lucide-react";
import { motion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

/* ─── Step SVG Animations (Alternate Concepts) ──────────────────────────── */

function SecureKeyhandshakeAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Background shield ring */}
      <circle cx="80" cy="45" r="32" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />

      {/* Pulsing security wave (triggered after lock unlocks) */}
      <motion.circle
        cx="80"
        cy="48"
        r="32"
        stroke="var(--success)"
        strokeWidth="1.5"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.3, 1.3, 0.5], opacity: [0, 0.6, 0.6, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.5, 0.8, 0.95],
          ease: "easeInOut"
        }}
      />

      {/* Lock Shackle */}
      <motion.path
        d="M 72 40 L 72 29 C 72 24, 88 24, 88 29 L 88 40"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        animate={{ y: [0, 0, -5, -5, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.45, 0.5, 0.8, 0.95],
          ease: "easeInOut"
        }}
      />

      {/* Lock Body */}
      <rect x="65" y="38" width="30" height="22" rx="4" fill="var(--card)" stroke="var(--accent)" strokeWidth="1.75" />
      
      {/* Keyhole detail */}
      <circle cx="80" cy="46" r="2.5" fill="var(--accent)" />
      <polygon points="78.5,46 81.5,46 82.5,53 77.5,53" fill="var(--accent)" />

      {/* Slide & turn key group */}
      <motion.g
        animate={{
          x: [20, 64, 64, 64, 20],
          rotate: [0, 0, 90, 0, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.25, 0.45, 0.65, 0.95],
          ease: "easeInOut"
        }}
        style={{ transformOrigin: "79px 46px" }}
      >
        {/* Key illustration */}
        <circle cx="67" cy="46" r="4" stroke="var(--success)" strokeWidth="1.5" fill="var(--card)" />
        <line x1="71" y1="46" x2="80" y2="46" stroke="var(--success)" strokeWidth="1.5" />
        <line x1="75" y1="46" x2="75" y2="49" stroke="var(--success)" strokeWidth="1.5" />
        <line x1="78" y1="46" x2="78" y2="49" stroke="var(--success)" strokeWidth="1.5" />
      </motion.g>
    </svg>
  );
}

function DataCompilerAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Central filter grid/matrix lines */}
      <line x1="80" y1="10" x2="80" y2="52" stroke="var(--border-strong)" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="80" cy="20" r="3" fill="var(--accent)" fillOpacity="0.4" />
      <circle cx="80" cy="31" r="3" fill="var(--accent)" fillOpacity="0.4" />
      <circle cx="80" cy="42" r="3" fill="var(--accent)" fillOpacity="0.4" />

      {/* Chaotic stream items flowing from Gmail side (Left) */}
      <motion.circle
        r="2"
        fill="var(--danger)"
        animate={{ cx: [15, 80], cy: [18, 20], opacity: [0, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.circle
        r="2"
        fill="var(--danger)"
        animate={{ cx: [20, 80], cy: [38, 31], opacity: [0, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
      />

      {/* Chaotic stream items flowing from Calendar side (Right) */}
      <motion.circle
        r="2"
        fill="var(--accent)"
        animate={{ cx: [145, 80], cy: [18, 20], opacity: [0, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
      />
      <motion.circle
        r="2"
        fill="var(--accent)"
        animate={{ cx: [140, 80], cy: [38, 42], opacity: [0, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 1.1 }}
      />

      {/* Compiled organized database items at the bottom */}
      <g transform="translate(35, 60)">
        {/* Row 1 */}
        <rect x="0" y="0" width="90" height="9" rx="2.5" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <motion.rect
          x="1"
          y="1"
          width="88"
          height="7"
          rx="1.5"
          fill="var(--success)"
          fillOpacity="0.12"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="6" cy="4.5" r="1.5" fill="var(--success)" />
        <rect x="12" y="3.5" width="40" height="2" rx="1" fill="var(--text-primary)" fillOpacity="0.8" />
        <rect x="58" y="3.5" width="26" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.5" />
      </g>

      <g transform="translate(35, 72)">
        {/* Row 2 */}
        <rect x="0" y="0" width="90" height="9" rx="2.5" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <motion.rect
          x="1"
          y="1"
          width="88"
          height="7"
          rx="1.5"
          fill="var(--accent)"
          fillOpacity="0.12"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
        />
        <circle cx="6" cy="4.5" r="1.5" fill="var(--accent)" />
        <rect x="12" y="3.5" width="30" height="2" rx="1" fill="var(--text-primary)" fillOpacity="0.8" />
        <rect x="48" y="3.5" width="36" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.5" />
      </g>
    </svg>
  );
}

function ReasoningChainAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Node connectors */}
      <line x1="42" y1="45" x2="68" y2="45" stroke="var(--border-strong)" strokeWidth="1.25" strokeDasharray="3 3" />
      <line x1="92" y1="45" x2="118" y2="45" stroke="var(--border-strong)" strokeWidth="1.25" strokeDasharray="3 3" />

      {/* Wave impulse 1 (Command to Reasoning) */}
      <motion.circle
        r="2.5"
        fill="var(--accent)"
        animate={{ cx: [42, 68], opacity: [0, 1, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          times: [0, 0.25, 0.35],
          ease: "easeInOut"
        }}
        style={{ cy: 45 }}
      />

      {/* Wave impulse 2 (Reasoning to Action) */}
      <motion.circle
        r="2.5"
        fill="var(--success)"
        animate={{ cx: [92, 118], opacity: [0, 1, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          times: [0, 0.55, 0.65],
          ease: "easeInOut"
        }}
        style={{ cy: 45 }}
      />

      {/* Node 1: Command input bubble */}
      <g transform="translate(18, 33)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
        {/* Stylized speech bubble */}
        <rect x="4" y="6" width="16" height="10" rx="2" stroke="var(--accent)" strokeWidth="1" />
        <path d="M 8 16 L 8 19 L 11 16 Z" stroke="var(--accent)" strokeWidth="1" strokeLinejoin="miter" fill="none" />
        <line x1="7" y1="9" x2="17" y2="9" stroke="var(--accent)" strokeWidth="1" />
        <line x1="7" y1="12" x2="13" y2="12" stroke="var(--accent)" strokeWidth="1" />
      </g>

      {/* Node 2: Reasoning cog wheels */}
      <g transform="translate(68, 33)">
        <circle cx="12" cy="12" r="12" fill="var(--accent)" fillOpacity="0.1" />
        
        {/* Large gear rotation */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "12px 12px" }}
        >
          <circle cx="12" cy="12" r="5" stroke="var(--accent)" strokeWidth="1.25" />
          <line x1="12" y1="4" x2="12" y2="7" stroke="var(--accent)" strokeWidth="1.25" />
          <line x1="12" y1="17" x2="12" y2="20" stroke="var(--accent)" strokeWidth="1.25" />
          <line x1="4" y1="12" x2="7" y2="12" stroke="var(--accent)" strokeWidth="1.25" />
          <line x1="17" y1="12" x2="20" y2="12" stroke="var(--accent)" strokeWidth="1.25" />
        </motion.g>

        {/* Small gear rotation (reverse direction) */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "17px 7px" }}
        >
          <circle cx="17" cy="7" r="3" stroke="var(--accent)" strokeWidth="1" fill="var(--card)" />
          <line x1="17" y1="2" x2="17" y2="4" stroke="var(--accent)" strokeWidth="1" />
          <line x1="17" y1="10" x2="17" y2="12" stroke="var(--accent)" strokeWidth="1" />
          <line x1="14" y1="7" x2="15" y2="7" stroke="var(--accent)" strokeWidth="1" />
          <line x1="19" y1="7" x2="20" y2="7" stroke="var(--accent)" strokeWidth="1" />
        </motion.g>
      </g>

      {/* Node 3: Action checklist checkmark */}
      <g transform="translate(118, 33)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
        
        {/* Tiny checkboard details */}
        <rect x="4" y="6" width="4" height="4" rx="0.5" fill="var(--success)" fillOpacity="0.2" stroke="var(--success)" strokeWidth="0.75" />
        <rect x="4" y="14" width="4" height="4" rx="0.5" fill="var(--success)" fillOpacity="0.2" stroke="var(--success)" strokeWidth="0.75" />
        
        <line x1="11" y1="8" x2="19" y2="8" stroke="var(--text-muted)" strokeWidth="1" />
        <line x1="11" y1="16" x2="17" y2="16" stroke="var(--text-muted)" strokeWidth="1" />

        {/* Action checkmark drawing inside box 1 */}
        <motion.path
          d="M 5.5 8 L 6.5 9 L 8.5 7"
          stroke="var(--success)"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ pathLength: [0, 0, 1, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.6, 0.75, 0.95, 1],
            ease: "easeInOut"
          }}
        />

        {/* Action checkmark drawing inside box 2 */}
        <motion.path
          d="M 5.5 16 L 6.5 17 L 8.5 15"
          stroke="var(--success)"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ pathLength: [0, 0, 1, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            times: [0, 0.65, 0.8, 0.95, 1],
            ease: "easeInOut"
          }}
        />
      </g>
    </svg>
  );
}

/* ─── Step Cards Component ──────────────────────────────────────────────── */

interface StepProps {
  stepNumber: string;
  title: string;
  description: string;
  Illustration: React.ComponentType;
  details: string[];
}

function StepCard({ stepNumber, title, description, Illustration, details }: StepProps) {
  return (
    <Reveal className="group relative rounded-2xl border border-line bg-surface2/30 hover:bg-surface2/45 p-6 md:p-8 flex flex-col gap-6 transition-all duration-300 hover:shadow-md">
      {/* Top Info */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold text-accent-ink tracking-widest uppercase">Step {stepNumber}</span>
          <h3 className="font-display text-lg font-semibold tracking-tight text-text mt-1">
            {title}
          </h3>
        </div>
        <ArrowRight size={16} className="text-muted group-hover:text-text group-hover:translate-x-1 transition-all" />
      </div>

      {/* Diagram Panel */}
      <div className="flex items-center justify-center bg-surface border border-line-strong rounded-xl p-4 h-[190px] relative overflow-hidden select-none">
        <Illustration />
      </div>

      {/* Description & Details */}
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary leading-relaxed font-normal">{description}</p>
        
        <div className="flex flex-col gap-2.5 text-muted mt-2">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-ink text-[10px] font-bold">
                {idx + 1}
              </span>
              <p className="text-[13px] leading-relaxed text-muted font-normal">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function HowItWorks() {
  return (
    <section className="py-24 md:py-32">
      <Container className="flex flex-col gap-16">
        <SectionHeading
          eyebrow="How it works"
          title="Designed for immediate efficiency."
          subtitle="Three simple steps translate your everyday workspaces into an automated, AI-augmented productivity engine."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <StepCard
            stepNumber="1"
            title="Secure Connection"
            description="Link your Gmail and Calendar accounts securely in under a minute."
            Illustration={SecureKeyhandshakeAnimation}
            details={[
              "OAuth 2.0 Security: Link your Google Workspace using official authentication scopes.",
              "Encrypted Session DEKs: All operational access keys are encrypted with AES-256."
            ]}
          />

          <StepCard
            stepNumber="2"
            title="Dashboard Interface"
            description="Access your workspace components directly from a unified pane."
            Illustration={DataCompilerAnimation}
            details={[
              "Unified Inbox: Browse folders, manage drafts, compose and send emails directly.",
              "Month Grid: Inspect your schedules, track slots, and edit calendar events in real-time."
            ]}
          />

          <StepCard
            stepNumber="3"
            title="Automate with AI Copilot"
            description="Command the assistant to manage your inbox and schedules."
            Illustration={ReasoningChainAnimation}
            details={[
              "MCP Tool Calling: The AI uses context-aware Model Context Protocol tools safely.",
              "Staging Drafts: No action occurs without approval. Review drafts before they dispatch."
            ]}
          />
        </div>

        {/* Bottom trust note */}
        <Reveal delay={200} y={16}>
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-muted">
              <ShieldCheck size={13} strokeWidth={2} className="text-accent-ink shrink-0" />
              OAuth 2.0 Secured · Sandbox Isolation · Staged Approvals Only
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}


