"use client";

import { Search, Cloud, Database, Layers, ShieldCheck, Mail, Calendar, Bot, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import GlassCard from "../ui/GlassCard";

/* ─── Bento SVG Animations ──────────────────────────────────────────────── */

function SemanticSearchAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Search Bar */}
      <rect x="15" y="8" width="130" height="12" rx="3" fill="var(--surface-subtle)" stroke="var(--border)" strokeWidth="0.75" />
      <Search size={6} className="text-accent absolute" style={{ transform: "translate(20px, 11px)" }} />

      {/* Query text input "stripe payouts" */}
      <text x="28" y="16.5" fill="var(--text-primary)" fontSize="6" fontWeight="semibold" className="font-sans">
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.05, 0.88, 0.95] }}>s</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.09, 0.88, 0.95] }}>t</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.13, 0.88, 0.95] }}>r</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.17, 0.88, 0.95] }}>i</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.21, 0.88, 0.95] }}>p</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.25, 0.88, 0.95] }}>e</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.30, 0.88, 0.95] }}> </motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.34, 0.88, 0.95] }}>p</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.38, 0.88, 0.95] }}>a</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.42, 0.88, 0.95] }}>y</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.46, 0.88, 0.95] }}>o</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.50, 0.88, 0.95] }}>u</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.54, 0.88, 0.95] }}>t</motion.tspan>
        <motion.tspan opacity={0} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.58, 0.88, 0.95] }}>s</motion.tspan>
      </text>

      {/* Blinking cursor */}
      <motion.line
        x1="76"
        y1="11"
        x2="76"
        y2="17"
        stroke="var(--accent)"
        strokeWidth="1"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />

      {/* Semantic vector paths mapping search queries down to documents */}
      <motion.path
        d="M 80 20 L 40 45"
        stroke="var(--success)"
        strokeWidth="1"
        strokeDasharray="2 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 0, 1, 1, 0] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.56, 0.64, 0.88, 0.95] }}
      />
      <motion.path
        d="M 80 20 L 80 45"
        stroke="var(--success)"
        strokeWidth="1"
        strokeDasharray="2 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 0, 1, 1, 0] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.56, 0.64, 0.88, 0.95] }}
      />
      <motion.path
        d="M 80 20 L 120 45"
        stroke="var(--success)"
        strokeWidth="1"
        strokeDasharray="2 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 0, 1, 1, 0] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.56, 0.64, 0.88, 0.95] }}
      />

      {/* Matched Documents below */}
      <g transform="translate(15, 48)">
        {/* Document 1: Vercel (Semantic match: 40%) */}
        <motion.g
          animate={{ opacity: [0.3, 0.3, 0.5, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.62, 0.68, 0.88, 0.95] }}
        >
          <rect x="0" y="0" width="36" height="24" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
          <rect x="4" y="4" width="15" height="2" rx="0.5" fill="var(--text-muted)" />
          <rect x="4" y="9" width="28" height="1.5" rx="0.5" fill="var(--text-muted)" fillOpacity="0.5" />
          <rect x="4" y="13" width="20" height="1.5" rx="0.5" fill="var(--text-muted)" fillOpacity="0.5" />
        </motion.g>

        {/* Document 2: Stripe (Semantic match: 98% -> Glows green!) */}
        <motion.g
          animate={{
            stroke: ["var(--border)", "var(--success)", "var(--success)", "var(--border)"],
            fillOpacity: [0, 0.1, 0.1, 0],
            scale: [1, 1, 1.05, 1.05, 1]
          }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.62, 0.68, 0.88, 0.95] }}
          style={{ transformOrigin: "80px 12px" }}
          transform="translate(45, 0)"
        >
          <rect x="0" y="0" width="36" height="24" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
          {/* Highlight overlay */}
          <rect x="0" y="0" width="36" height="24" rx="3" fill="var(--success)" fillOpacity="0.05" />
          <rect x="4" y="4" width="22" height="2" rx="0.5" fill="var(--success)" />
          <rect x="4" y="9" width="28" height="1.5" rx="0.5" fill="var(--text-primary)" />
          <rect x="4" y="13" width="24" height="1.5" rx="0.5" fill="var(--text-primary)" />
          <circle cx="30" cy="5" r="1.5" fill="var(--success)" />
        </motion.g>

        {/* Document 3: Github (Semantic match: 20%) */}
        <motion.g
          animate={{ opacity: [0.3, 0.3, 0.4, 0.4, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, times: [0, 0.62, 0.68, 0.88, 0.95] }}
          transform="translate(90, 0)"
        >
          <rect x="0" y="0" width="36" height="24" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
          <rect x="4" y="4" width="18" height="2" rx="0.5" fill="var(--text-muted)" />
          <rect x="4" y="9" width="26" height="1.5" rx="0.5" fill="var(--text-muted)" fillOpacity="0.5" />
          <rect x="4" y="13" width="16" height="1.5" rx="0.5" fill="var(--text-muted)" fillOpacity="0.5" />
        </motion.g>
      </g>
    </svg>
  );
}

function LiveWebhookSyncAnimation() {
  return (
    <svg
      viewBox="0 0 100 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Google Cloud/Webhook Node */}
      <g transform="translate(38, 10)">
        <circle cx="12" cy="12" r="12" fill="var(--accent)" fillOpacity="0.1" />
        <motion.circle
          cx="12"
          cy="12"
          r="14"
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="2 2"
          animate={{ scale: [1, 2], opacity: [0.8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Cloud vector */}
        <Cloud size={10} className="text-accent absolute" style={{ transform: "translate(7px, 7px)" }} />
      </g>

      {/* Downward data pathway line */}
      <line x1="50" y1="38" x2="50" y2="100" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />

      {/* Packet 1 sliding down pathway (Mail) */}
      <motion.g
        animate={{ y: [35, 104], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeIn" }}
        transform="translate(43, 0)"
      >
        <rect x="0" y="0" width="14" height="10" rx="1.5" fill="var(--danger)" stroke="var(--card)" strokeWidth="0.5" />
        <path d="M 2 2 L 7 6 L 12 2" stroke="#fff" strokeWidth="0.75" />
      </motion.g>

      {/* Packet 2 sliding down pathway (Calendar - staggered) */}
      <motion.g
        animate={{ y: [35, 104], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeIn", delay: 1.25 }}
        transform="translate(43, 0)"
      >
        <rect x="0" y="0" width="14" height="10" rx="1.5" fill="var(--accent)" stroke="var(--card)" strokeWidth="0.5" />
        <rect x="3" y="3" width="8" height="5" rx="0.5" fill="none" stroke="#fff" strokeWidth="0.5" />
      </motion.g>

      {/* Dashboard live list mockup at the bottom */}
      <g transform="translate(10, 108)">
        <rect x="0" y="0" width="80" height="42" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
        <rect x="6" y="5" width="22" height="3" rx="1" fill="var(--text-primary)" />

        {/* List items compiling */}
        <motion.g
          animate={{
            borderColor: ["var(--border)", "var(--success)", "var(--border)"],
            fill: ["var(--surface)", "var(--success)", "var(--surface)"],
            fillOpacity: [1, 0.1, 1]
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 2.1 }}
          transform="translate(6, 12)"
        >
          <rect x="0" y="0" width="68" height="10" rx="2" stroke="var(--border)" strokeWidth="0.5" />
          <circle cx="5" cy="5" r="1.5" fill="var(--danger)" />
          <rect x="12" y="3.5" width="30" height="1.5" rx="0.5" fill="var(--text-primary)" />
          <rect x="46" y="3.5" width="16" height="1.5" rx="0.5" fill="var(--text-muted)" fillOpacity="0.5" />
        </motion.g>

        <motion.g
          animate={{
            borderColor: ["var(--border)", "var(--success)", "var(--border)"],
            fill: ["var(--surface)", "var(--success)", "var(--surface)"],
            fillOpacity: [1, 0.1, 1]
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.85 }}
          transform="translate(6, 25)"
        >
          <rect x="0" y="0" width="68" height="10" rx="2" stroke="var(--border)" strokeWidth="0.5" />
          <circle cx="5" cy="5" r="1.5" fill="var(--accent)" />
          <rect x="12" y="3.5" width="40" height="1.5" rx="0.5" fill="var(--text-primary)" />
          <rect x="56" y="3.5" width="8" height="1.5" rx="0.5" fill="var(--text-muted)" fillOpacity="0.5" />
        </motion.g>
      </g>
    </svg>
  );
}

function ContextMemoryAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Database History Stack on the left */}
      <g transform="translate(15, 12)">
        {/* Block 3 (Oldest) */}
        <rect x="0" y="44" width="50" height="16" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <rect x="6" y="49" width="30" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.4" />
        <rect x="6" y="53" width="20" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.4" />

        {/* Block 2 (Target context recall) */}
        <motion.g
          animate={{
            borderColor: ["var(--border)", "var(--success)", "var(--success)", "var(--border)"],
            stroke: ["var(--border)", "var(--success)", "var(--success)", "var(--border)"],
            scale: [1, 1.05, 1.05, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.32, 0.72, 0.95] }}
          style={{ transformOrigin: "25px 32px" }}
          transform="translate(0, 22)"
        >
          <rect x="0" y="0" width="50" height="16" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
          <rect x="6" y="5" width="38" height="2" rx="1" fill="var(--text-primary)" />
          <rect x="6" y="9" width="24" height="2" rx="1" fill="var(--text-primary)" />
        </motion.g>

        {/* Block 1 (Latest query context) */}
        <rect x="0" y="0" width="50" height="16" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <rect x="6" y="5" width="22" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.7" />
        <rect x="6" y="9" width="34" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.7" />
      </g>

      {/* Memory recall extraction scanning line */}
      <motion.line
        x1="12"
        y1="22"
        x2="68"
        y2="22"
        stroke="var(--success)"
        strokeWidth="1.5"
        animate={{ y: [10, 42, 42, 10] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.3, 0.75, 0.98] }}
      />

      {/* Connection pathway from Database to Chat Bubble */}
      <motion.path
        d="M 65 42 L 105 42"
        stroke="var(--success)"
        strokeWidth="1"
        strokeDasharray="2 2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 0, 1, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.32, 0.52, 0.78, 0.95] }}
      />

      {/* Data packet traveling */}
      <motion.circle
        r="2"
        fill="var(--success)"
        animate={{ cx: [65, 105], opacity: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.32, 0.52, 0.98] }}
        style={{ cy: 42 }}
      />

      {/* Chat Bubble on the right (Active context integration) */}
      <g transform="translate(105, 18)">
        <rect x="0" y="0" width="40" height="42" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />

        {/* Chat UI header */}
        <rect x="5" y="5" width="18" height="2.5" rx="1" fill="var(--accent)" />
        <line x1="5" y1="11" x2="35" y2="11" stroke="var(--border)" strokeWidth="0.5" />

        {/* Existing text */}
        <rect x="5" y="16" width="30" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.5" />

        {/* Recalled memory lines fading/popping in */}
        <motion.rect
          x="5"
          y="22"
          width="26"
          height="2"
          rx="1"
          fill="var(--success)"
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.48, 0.54, 0.82, 0.95] }}
        />
        <motion.rect
          x="5"
          y="27"
          width="32"
          height="2"
          rx="1"
          fill="var(--success)"
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.52, 0.58, 0.82, 0.95] }}
        />
        <motion.rect
          x="5"
          y="32"
          width="18"
          height="2"
          rx="1"
          fill="var(--success)"
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.56, 0.62, 0.82, 0.95] }}
        />
      </g>
    </svg>
  );
}

function MCPOrchestrationAnimation() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Connection paths radiating from center AI Node */}
      <line x1="80" y1="45" x2="35" y2="25" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="80" y1="45" x2="35" y2="65" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="80" y1="45" x2="125" y2="45" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="2 2" />

      {/* Dynamic connection beams flashing sequentially */}
      {/* AI -> Mail */}
      <motion.line
        x1="80"
        y1="45"
        x2="35"
        y2="25"
        stroke="var(--success)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.15, 0.35, 0.45] }}
      />
      {/* AI -> Calendar */}
      <motion.line
        x1="80"
        y1="45"
        x2="35"
        y2="65"
        stroke="var(--success)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 0, 1, 1, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.42, 0.62, 0.72] }}
      />
      {/* AI -> Database */}
      <motion.line
        x1="80"
        y1="45"
        x2="125"
        y2="45"
        stroke="var(--success)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 0, 0, 1, 1, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.70, 0.88, 0.96] }}
      />

      {/* Target Tool Node 1: Gmail (Left Top) */}
      <g transform="translate(20, 13)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <Mail size={8} className="text-danger absolute" style={{ transform: "translate(8px, 8px)" }} />
        <motion.circle
          cx="12"
          cy="12"
          r="11.5"
          stroke="var(--success)"
          strokeWidth="1.25"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.15, 0.45, 0.98] }}
        />
      </g>

      {/* Target Tool Node 2: Google Calendar (Left Bottom) */}
      <g transform="translate(20, 53)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <Calendar size={8} className="text-accent absolute" style={{ transform: "translate(8px, 8px)" }} />
        <motion.circle
          cx="12"
          cy="12"
          r="11.5"
          stroke="var(--success)"
          strokeWidth="1.25"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.42, 0.48, 0.72, 0.98] }}
        />
      </g>

      {/* Target Tool Node 3: Drizzle DB / Search (Right Center) */}
      <g transform="translate(125, 33)">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
        <Database size={8} className="text-zinc-500 absolute" style={{ transform: "translate(8px, 8px)" }} />
        <motion.circle
          cx="12"
          cy="12"
          r="11.5"
          stroke="var(--success)"
          strokeWidth="1.25"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.70, 0.76, 0.96] }}
        />
      </g>

      {/* Center AI Bot face controller */}
      <g transform="translate(70, 33)">
        <circle cx="10" cy="12" r="12" fill="var(--accent)" fillOpacity="0.1" />
        <circle cx="10" cy="12" r="11" stroke="var(--accent)" strokeWidth="1" />

        {/* Robot face */}
        <rect x="4" y="8" width="12" height="9" rx="2" fill="var(--accent)" />
        <circle cx="7" cy="12.5" r="1" fill="var(--card)" />
        <circle cx="13" cy="12.5" r="1" fill="var(--card)" />
        <line x1="10" y1="8" x2="10" y2="5" stroke="var(--accent)" strokeWidth="1" />
        <circle cx="10" cy="4" r="1" fill="var(--accent)" />
      </g>
    </svg>
  );
}

function DraftStagingAnimation() {
  return (
    <svg
      viewBox="0 0 320 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Connection path line from Outbox to Server */}
      <line x1="90" y1="45" x2="230" y2="45" stroke="var(--border-strong)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Glowing pathway wave when clicked */}
      <motion.line
        x1="90"
        y1="45"
        x2="230"
        y2="45"
        stroke="var(--success)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 0, 1, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.35, 0.55, 0.85, 0.95], ease: "easeInOut" }}
      />

      {/* Left Node: Staged Draft Vault */}
      <g transform="translate(15, 15)">
        <rect x="0" y="0" width="75" height="60" rx="4" fill="var(--card)" stroke="var(--accent)" strokeWidth="1" />
        <rect x="8" y="10" width="35" height="3" rx="1.5" fill="var(--text-primary)" />
        <rect x="8" y="18" width="58" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.6" />
        <rect x="8" y="24" width="50" height="2" rx="1" fill="var(--text-muted)" fillOpacity="0.6" />

        {/* Pending Badge */}
        <motion.rect
          x="8"
          y="38"
          width="48"
          height="12"
          rx="2"
          animate={{
            fill: ["var(--border-strong)", "var(--success)", "var(--success)", "var(--border-strong)"],
            fillOpacity: [0.15, 0.15, 0.15, 0.15],
            stroke: ["var(--border-strong)", "var(--success)", "var(--success)", "var(--border-strong)"]
          }}
          strokeWidth="0.5"
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.3, 0.8, 0.95] }}
        />
        <motion.text
          x="12"
          y="46.5"
          fontSize="5"
          fontWeight="bold"
          animate={{
            fill: ["var(--text-muted)", "var(--success)", "var(--success)", "var(--text-muted)"]
          }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.3, 0.8, 0.95] }}
        >
          STAGING DRAFT
        </motion.text>
      </g>

      {/* Center Approve Trigger Node */}
      <g transform="translate(145, 30)">
        <motion.circle
          cx="15"
          cy="15"
          r="14"
          fill="var(--success)"
          animate={{
            fillOpacity: [0.03, 0.15, 0.15, 0.03],
            stroke: ["var(--border)", "var(--success)", "var(--success)", "var(--border)"]
          }}
          strokeWidth="1.25"
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.25, 0.75, 0.95] }}
        />

        {/* Pulsing trigger wave */}
        <motion.circle
          cx="15"
          cy="15"
          r="14"
          stroke="var(--success)"
          strokeWidth="1.5"
          animate={{ scale: [0.8, 2.2], opacity: [1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 3.3, delay: 1, ease: "easeOut" }}
        />

        {/* Hand pointer clicking */}
        <motion.path
          d="M0 0 L0 8 L2 6 L5 10 L7 9 L4 5 L7 5 Z"
          fill="var(--text-primary)"
          stroke="var(--card)"
          strokeWidth="0.5"
          animate={{
            x: [42, 18, 18, 42],
            y: [36, 18, 18, 36]
          }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.22, 0.72, 0.95], ease: "easeInOut" }}
        />
      </g>

      {/* Outgoing Mail draft animation flying securely across path */}
      <motion.g
        initial={{ x: 30, y: 35, opacity: 0, scale: 0.9 }}
        animate={{
          x: [30, 30, 205, 205, 30],
          opacity: [0, 1, 1, 0, 0],
          scale: [0.9, 0.9, 0.65, 0.65, 0.9]
        }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.32, 0.58, 0.78, 0.98] }}
      >
        <rect x="0" y="0" width="16" height="12" rx="1.5" fill="var(--success)" stroke="var(--card)" strokeWidth="0.75" />
        <path d="M 2 3 L 8 7 L 14 3" stroke="#fff" strokeWidth="0.75" />
      </motion.g>

      {/* Right Node: Google Gmail server */}
      <g transform="translate(230, 15)">
        <rect x="0" y="0" width="75" height="60" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />

        {/* Outgoing feed stacks */}
        <rect x="8" y="10" width="58" height="12" rx="2" fill="var(--surface-subtle)" stroke="var(--border)" strokeWidth="0.5" />
        <circle cx="15" cy="16" r="2" fill="var(--success)" />
        <rect x="22" y="14" width="38" height="2" rx="1" fill="var(--text-primary)" fillOpacity="0.7" />

        <rect x="8" y="26" width="58" height="12" rx="2" fill="var(--surface-subtle)" stroke="var(--border)" strokeWidth="0.5" />
        <circle cx="15" cy="32" r="2" fill="var(--border-strong)" />
        <rect x="22" y="30" width="28" height="2" rx="1" fill="var(--text-primary)" fillOpacity="0.7" />

        <rect x="8" y="42" width="58" height="12" rx="2" fill="var(--surface-subtle)" stroke="var(--border)" strokeWidth="0.5" />
        <circle cx="15" cy="48" r="2" fill="var(--border-strong)" />
        <rect x="22" y="46" width="34" height="2" rx="1" fill="var(--text-primary)" fillOpacity="0.7" />
      </g>
    </svg>
  );
}

/* ─── Bento Items ────────────────────────────────────────────────────────── */

interface BentoItem {
  icon: any;
  title: string;
  description: string;
  Illustration: React.ComponentType;
  className: string;
  delay: number;
}

const BENTO_FEATURES: BentoItem[] = [
  {
    icon: Search,
    title: "AI Semantic Search",
    description: "Search your inbox in plain English. The AI parses semantic query intent to locate precise details instantly.",
    Illustration: SemanticSearchAnimation,
    className: "md:col-span-2",
    delay: 0,
  },
  {
    icon: Cloud,
    title: "Live Webhook Sync Feed",
    description: "Receive instant updates. Our Google Webhooks listener pushes incoming messages and events to your dashboard in real-time.",
    Illustration: LiveWebhookSyncAnimation,
    className: "md:row-span-2",
    delay: 100,
  },
  {
    icon: Database,
    title: "Context Memory Vault",
    description: "Continuous chat intelligence. The AI co-pilot retains the history of your last 20 messages for cohesive task planning.",
    Illustration: ContextMemoryAnimation,
    className: "md:col-span-1",
    delay: 200,
  },
  {
    icon: Layers,
    title: "Multi-Tool MCP Orchestration",
    description: "Execute complex operations. The agent calls Model Context Protocol (MCP) actions across Gmail and Calendar sequentially.",
    Illustration: MCPOrchestrationAnimation,
    className: "md:col-span-1",
    delay: 300,
  },
  {
    icon: ShieldCheck,
    title: "Zero-Trust Draft Staging Control",
    description: "Complete safety. The assistant creates and structures changes, but nothing dispatches without your explicit manual approval.",
    Illustration: DraftStagingAnimation,
    className: "md:col-span-3",
    delay: 400,
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything your inbox needs to run itself"
          subtitle="Five core modules working in concert — so your email and calendar operate on autopilot while you stay in control."
        />

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
          {BENTO_FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const Illustration = feature.Illustration;
            return (
              <Reveal key={feature.title} delay={feature.delay} className={`${feature.className} flex flex-col`}>
                <GlassCard hover className="group flex h-full flex-col gap-5 p-6 justify-between">
                  {/* SVG Illustration wrapper */}
                  <div className={`w-full overflow-hidden rounded-lg bg-surface2 p-3 flex items-center justify-center ${feature.className.includes("row-span-2")
                      ? "flex-1 min-h-[260px] md:min-h-[310px]"
                      : "min-h-[140px] max-h-[200px]"
                    }`}>
                    <Illustration />
                  </div>

                  {/* Info text & header */}
                  <div className="space-y-4">
                    {/* Icon chip */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 border border-line transition-transform duration-300 group-hover:scale-105">
                      <Icon size={16} strokeWidth={2} className="text-accent-ink" />
                    </div>

                    {/* Copy text */}
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-display text-base font-semibold leading-snug tracking-tight text-text">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted font-normal">
                        {feature.description}
                      </p>
                    </div>
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


