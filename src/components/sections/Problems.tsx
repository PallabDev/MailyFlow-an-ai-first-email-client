"use client";

import { Mail, Calendar, Bot } from "lucide-react";
import { motion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import GlassCard from "../ui/GlassCard";

/* ─── SVG Animations using Framer Motion ─────────────────────────────────── */

function EmailInboxAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Header bar of the mock inbox window */}
      <rect x="10" y="8" width="140" height="10" rx="3" fill="var(--border)" fillOpacity="0.3" />
      <circle cx="18" cy="13" r="1.5" fill="var(--accent)" fillOpacity="0.6" />
      <circle cx="23" cy="13" r="1.5" fill="var(--accent)" fillOpacity="0.4" />
      <circle cx="28" cy="13" r="1.5" fill="var(--accent)" fillOpacity="0.2" />
      <rect x="40" y="11" width="60" height="4" rx="2" fill="var(--border)" fillOpacity="0.5" />

      {/* Stacked email rows that animate on load/loop */}
      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3.5, delay: 0.2 }}
      >
        {/* Row 1 */}
        <rect x="10" y="24" width="140" height="16" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <circle cx="20" cy="32" r="4" fill="var(--accent)" fillOpacity="0.8" />
        <rect x="30" y="29" width="45" height="3" rx="1.5" fill="var(--text-primary)" fillOpacity="0.8" />
        <rect x="30" y="34" width="75" height="2.5" rx="1.25" fill="var(--text-muted)" fillOpacity="0.6" />
        {/* Unread indicator */}
        <motion.circle
          cx="140"
          cy="32"
          r="2"
          fill="var(--success)"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.g>

      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3.5, delay: 0.7 }}
      >
        {/* Row 2 */}
        <rect x="10" y="44" width="140" height="16" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <circle cx="20" cy="52" r="4" fill="var(--border-strong)" />
        <rect x="30" y="49" width="35" height="3" rx="1.5" fill="var(--text-primary)" fillOpacity="0.8" />
        <rect x="30" y="54" width="85" height="2.5" rx="1.25" fill="var(--text-muted)" fillOpacity="0.6" />
      </motion.g>

      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3.5, delay: 1.2 }}
      >
        {/* Row 3 */}
        <rect x="10" y="64" width="140" height="16" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <circle cx="20" cy="72" r="4" fill="var(--accent)" fillOpacity="0.5" />
        <rect x="30" y="69" width="55" height="3" rx="1.5" fill="var(--text-primary)" fillOpacity="0.8" />
        <rect x="30" y="74" width="60" height="2.5" rx="1.25" fill="var(--text-muted)" fillOpacity="0.6" />
      </motion.g>
    </svg>
  );
}

function CalendarSyncAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Calendar Header */}
      <rect x="15" y="8" width="130" height="12" rx="3" fill="var(--accent)" fillOpacity="0.15" />
      <rect x="23" y="12" width="35" height="4" rx="2" fill="var(--accent)" />
      
      {/* Calendar Grid Lines */}
      <rect x="15" y="8" width="130" height="74" rx="3" stroke="var(--border)" strokeWidth="1" />
      <line x1="15" y1="20" x2="145" y2="20" stroke="var(--border)" strokeWidth="1" />
      
      {/* Vertical Dividers */}
      <line x1="41" y1="20" x2="41" y2="82" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="67" y1="20" x2="67" y2="82" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="93" y1="20" x2="93" y2="82" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="119" y1="20" x2="119" y2="82" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2" />
      
      {/* Horizontal Dividers */}
      <line x1="15" y1="40" x2="145" y2="40" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="15" y1="60" x2="145" y2="60" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2" />

      {/* Static grid events */}
      <rect x="18" y="23" width="20" height="14" rx="2" fill="var(--border-strong)" fillOpacity="0.4" />
      <rect x="96" y="43" width="20" height="14" rx="2" fill="var(--border-strong)" fillOpacity="0.4" />

      {/* Target event cell to be scheduled (Row 2, Column 3) */}
      <motion.rect
        x="70"
        y="43"
        width="20"
        height="14"
        rx="2"
        fill="var(--success)"
        fillOpacity="0.85"
        style={{ transformOrigin: "70px 50px" }}
        animate={{ scale: [0, 0, 1, 1, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.35, 0.45, 0.85, 0.95],
          ease: "easeInOut"
        }}
      />

      {/* Checkmark drawing on top of the success block */}
      <motion.path
        d="M 76 50 L 79 53 L 84 47"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ pathLength: [0, 0, 1, 1, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.45, 0.55, 0.85, 0.95],
          ease: "easeInOut"
        }}
      />

      {/* Cursor arrow pointing & clicking */}
      <motion.path
        d="M0 0 L0 10 L3 7 L7 12 L9 11 L5 6 L9 6 Z"
        fill="var(--text-primary)"
        stroke="var(--card)"
        strokeWidth="0.5"
        animate={{
          x: [130, 80, 80, 130],
          y: [70, 52, 52, 70]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut"
        }}
      />
      
      {/* Click ring wave animation */}
      <motion.circle
        cx="80"
        cy="52"
        r="6"
        stroke="var(--success)"
        strokeWidth="1.5"
        animate={{ scale: [0.5, 2.5], opacity: [1, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 3.4,
          delay: 1.2,
          ease: "easeOut"
        }}
      />
    </svg>
  );
}

function AICopilotAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Connecting channels (Top and Bottom tracks) */}
      <line x1="42" y1="41" x2="70" y2="41" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="70" y1="49" x2="42" y2="49" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="90" y1="41" x2="118" y2="41" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="118" y1="49" x2="90" y2="49" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />

      {/* Left Node: Mail */}
      <g transform="translate(18, 33)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
        <path d="M 4 7 L 12 12 L 20 7" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="4" y="6" width="16" height="12" rx="1" stroke="var(--accent)" strokeWidth="1" />
      </g>

      {/* Right Node: Calendar */}
      <g transform="translate(118, 33)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
        <rect x="4" y="8" width="16" height="11" rx="1" stroke="var(--accent)" strokeWidth="1" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="var(--accent)" strokeWidth="1" />
        <circle cx="8" cy="15" r="1" fill="var(--accent)" />
        <circle cx="12" cy="15" r="1" fill="var(--accent)" />
        <circle cx="16" cy="15" r="1" fill="var(--accent)" />
        <line x1="8" y1="5" x2="8" y2="8" stroke="var(--accent)" strokeWidth="1" />
        <line x1="16" y1="5" x2="16" y2="8" stroke="var(--accent)" strokeWidth="1" />
      </g>

      {/* Center AI Bot Node */}
      <g transform="translate(68, 33)">
        <circle cx="12" cy="12" r="12" fill="var(--accent)" fillOpacity="0.1" />
        <motion.circle
          cx="12"
          cy="12"
          r="11"
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="3 3"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, ease: "linear", repeat: Infinity }}
        />
        {/* Robot face illustration inside center node */}
        <rect x="6" y="8" width="12" height="9" rx="2" fill="var(--accent)" />
        <circle cx="9" cy="12.5" r="1" fill="var(--card)" />
        <circle cx="15" cy="12.5" r="1" fill="var(--card)" />
        <line x1="12" y1="8" x2="12" y2="5" stroke="var(--accent)" strokeWidth="1" />
        <circle cx="12" cy="4" r="1" fill="var(--accent)" />
        <line x1="9" y1="14.5" x2="15" y2="14.5" stroke="var(--card)" strokeWidth="0.75" strokeLinecap="round" />
      </g>

      {/* Moving data packets along lines */}
      {/* Packet 1 (Mail -> AI on top track) */}
      <motion.circle
        r="2"
        fill="var(--accent)"
        animate={{ cx: [42, 68], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ cy: 41 }}
      />
      {/* Packet 2 (AI -> Mail feedback on bottom track) */}
      <motion.circle
        r="2"
        fill="var(--accent)"
        animate={{ cx: [68, 42], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ cy: 49 }}
      />
      {/* Packet 3 (AI -> Calendar on top track) */}
      <motion.circle
        r="2"
        fill="var(--success)"
        animate={{ cx: [92, 118], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ cy: 41 }}
      />
      {/* Packet 4 (Calendar -> AI feedback on bottom track) */}
      <motion.circle
        r="2"
        fill="var(--success)"
        animate={{ cx: [118, 92], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        style={{ cy: 49 }}
      />
    </svg>
  );
}

/* ─── Offerings Card Data ────────────────────────────────────────────────── */

const OFFERINGS = [
  {
    icon: Mail,
    title: "Smart Email Inbox",
    description:
      "A gorgeous unified dashboard for your Google Mail. Compose new messages, organize inbox folders, manage existing drafts, search and delete threads in real-time.",
    Illustration: EmailInboxAnimation,
  },
  {
    icon: Calendar,
    title: "Interactive Calendar",
    description:
      "Full Google Calendar integration. Review your schedules in a responsive month grid, schedule new events, update invitation details, and keep track of conflicts.",
    Illustration: CalendarSyncAnimation,
  },
  {
    icon: Bot,
    title: "MCP-Powered AI Co-pilot",
    description:
      "A persistently connected AI assistant with tool-based Model Context Protocol (MCP) integrations. Ask it in natural language to locate threads, generate drafts, or book events.",
    Illustration: AICopilotAnimation,
  },
] as const;

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function Problems() {
  return (
    <section className="py-24 md:py-32">
      <Container className="flex flex-col gap-16">
        <SectionHeading
          eyebrow="What we offer"
          title="The AI-First email client that does the work for you."
          subtitle="MailyFlow brings your Gmail inbox, Google Calendar, and an intelligent conversational co-pilot together in one modern dashboard. Stop jumping between tabs."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {OFFERINGS.map((offering, i) => {
            const Icon = offering.icon;
            const Illustration = offering.Illustration;
            return (
              <Reveal key={offering.title} delay={i * 120}>
                <GlassCard hover className="flex h-full flex-col gap-5 p-6">
                  {/* Illustration panel */}
                  <div className="h-[120px] w-full overflow-hidden rounded-lg bg-surface2 p-3 flex items-center justify-center">
                    <Illustration />
                  </div>

                  {/* Icon chip */}
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface2">
                      <Icon size={16} strokeWidth={1.75} className="text-accent-ink" />
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex flex-col gap-2">
                    <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-text">
                      {offering.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{offering.description}</p>
                  </div>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

