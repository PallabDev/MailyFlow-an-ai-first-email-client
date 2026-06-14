import { MessageSquare, CalendarX, RefreshCw } from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import GlassCard from "../ui/GlassCard";

/* ─── SVG Illustrations ─────────────────────────────────────────────────── */

function ThreadIllustration() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Thread lines — stacked indented email replies */}
      <line x1="16" y1="18" x2="144" y2="18" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="30" x2="144" y2="30" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="42" x2="144" y2="42" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="52" y1="54" x2="144" y2="54" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="64" y1="66" x2="144" y2="66" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="76" y1="78" x2="144" y2="78" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Indent markers */}
      <polyline points="16,18 16,30 28,30" stroke="var(--border-strong)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="28,30 28,42 40,42" stroke="var(--border-strong)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="40,42 40,54 52,54" stroke="var(--border-strong)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="52,54 52,66 64,66" stroke="var(--border-strong)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="64,66 64,78 76,78" stroke="var(--border-strong)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIllustration() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Calendar grid */}
      <rect x="20" y="12" width="120" height="68" rx="4" stroke="var(--accent)" strokeWidth="1.5" />
      {/* Header bar */}
      <rect x="20" y="12" width="120" height="16" rx="4" fill="var(--accent)" fillOpacity="0.15" />
      <line x1="20" y1="28" x2="140" y2="28" stroke="var(--accent)" strokeWidth="1" />
      {/* Column dividers */}
      <line x1="37" y1="28" x2="37" y2="80" stroke="var(--border)" strokeWidth="1" />
      <line x1="54" y1="28" x2="54" y2="80" stroke="var(--border)" strokeWidth="1" />
      <line x1="71" y1="28" x2="71" y2="80" stroke="var(--border)" strokeWidth="1" />
      <line x1="88" y1="28" x2="88" y2="80" stroke="var(--border)" strokeWidth="1" />
      <line x1="105" y1="28" x2="105" y2="80" stroke="var(--border)" strokeWidth="1" />
      <line x1="122" y1="28" x2="122" y2="80" stroke="var(--border)" strokeWidth="1" />
      {/* Row dividers */}
      <line x1="20" y1="44" x2="140" y2="44" stroke="var(--border)" strokeWidth="1" />
      <line x1="20" y1="60" x2="140" y2="60" stroke="var(--border)" strokeWidth="1" />
      {/* Blocked event blocks */}
      <rect x="22" y="46" width="32" height="12" rx="2" fill="var(--accent)" fillOpacity="0.35" />
      <rect x="56" y="30" width="32" height="28" rx="2" fill="var(--accent)" fillOpacity="0.2" />
      <rect x="90" y="62" width="32" height="12" rx="2" fill="var(--accent)" fillOpacity="0.35" />
      <rect x="22" y="62" width="15" height="12" rx="2" fill="var(--border-strong)" fillOpacity="0.5" />
      {/* Conflict X */}
      <line x1="107" y1="32" x2="119" y2="44" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="119" y1="32" x2="107" y2="44" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LoopIllustration() {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="h-full w-full"
    >
      {/* Circular loop arrow */}
      <path
        d="M80 20 A34 34 0 1 1 46 54"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead */}
      <polyline points="38,48 46,54 52,46" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Task labels */}
      <rect x="60" y="11" width="40" height="9" rx="2" fill="var(--border-strong)" fillOpacity="0.6" />
      <rect x="110" y="34" width="32" height="9" rx="2" fill="var(--border-strong)" fillOpacity="0.6" />
      <rect x="60" y="68" width="40" height="9" rx="2" fill="var(--border-strong)" fillOpacity="0.6" />
      <rect x="18" y="34" width="28" height="9" rx="2" fill="var(--border-strong)" fillOpacity="0.6" />
      {/* Center dot */}
      <circle cx="80" cy="45" r="4" fill="var(--accent)" fillOpacity="0.5" />
    </svg>
  );
}

/* ─── Problem card data ──────────────────────────────────────────────────── */

const PROBLEMS = [
  {
    icon: MessageSquare,
    title: "Endless email threads",
    description:
      "Back-and-forth chains multiply faster than you can read them. Context gets buried, decisions stall, and your inbox becomes a liability.",
    Illustration: ThreadIllustration,
  },
  {
    icon: CalendarX,
    title: "Manual scheduling",
    description:
      "Finding a time that works for everyone is a full-time job. The calendar tetris tax drains hours that should go toward actual work.",
    Illustration: CalendarIllustration,
  },
  {
    icon: RefreshCw,
    title: "Repetitive admin work",
    description:
      "Status updates, follow-up reminders, meeting summaries — the same tasks, every single day. Valuable time spent on zero-leverage busywork.",
    Illustration: LoopIllustration,
  },
] as const;

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function Problems() {
  return (
    <section className="py-24 md:py-32">
      <Container className="flex flex-col gap-16">
        <SectionHeading
          eyebrow="The problem"
          title="Email was built for 1995. Your time wasn't."
          subtitle="Modern work demands instant decisions and seamless coordination. Traditional email tools were never designed for that — and it shows."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((problem, i) => {
            const Icon = problem.icon;
            const Illustration = problem.Illustration;
            return (
              <Reveal key={problem.title} delay={i * 120}>
                <GlassCard hover className="flex h-full flex-col gap-5 p-6">
                  {/* Illustration panel */}
                  <div className="h-[120px] w-full overflow-hidden rounded-lg bg-surface2 p-3">
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
                      {problem.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{problem.description}</p>
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
