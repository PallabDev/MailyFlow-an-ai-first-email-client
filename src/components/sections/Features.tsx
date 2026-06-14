import {
  Inbox,
  PenLine,
  CalendarClock,
  CalendarPlus,
  Search,
  Workflow,
  Sun,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import GlassCard from "../ui/GlassCard";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Inbox,
    title: "AI Email Triage",
    description:
      "Automatically sorts, labels, and prioritises your inbox so the most important messages surface first.",
  },
  {
    icon: PenLine,
    title: "Smart Draft Replies",
    description:
      "Context-aware reply drafts generated in your tone — ready to review and send in one click.",
  },
  {
    icon: CalendarClock,
    title: "Calendar Automation",
    description:
      "Reschedules conflicts, blocks focus time, and keeps your calendar optimised without manual effort.",
  },
  {
    icon: CalendarPlus,
    title: "Meeting Scheduling",
    description:
      "Finds the best slot across all attendees and sends invites — no back-and-forth required.",
  },
  {
    icon: Search,
    title: "AI Search",
    description:
      "Ask anything about your inbox in plain language and get precise answers with source references.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Chain multi-step email and calendar actions into repeatable workflows triggered by rules or prompts.",
  },
  {
    icon: Sun,
    title: "Daily Summaries",
    description:
      "Start every morning with a concise briefing of overnight emails, today's meetings, and pending tasks.",
  },
  {
    icon: ShieldCheck,
    title: "Approval Controls",
    description:
      "Nothing leaves your account without your sign-off. Review every AI action before it executes.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything your inbox needs to run itself"
          subtitle="Eight intelligent modules working in concert — so your email and calendar operate on autopilot while you stay in control."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={(i % 4) * 90}>
                <GlassCard hover className="group flex h-full flex-col gap-4 p-5">
                  {/* Icon chip */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon
                      size={18}
                      strokeWidth={1.75}
                      className="text-accent-ink"
                    />
                  </div>

                  {/* Text */}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-text">
                      {feature.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted">
                      {feature.description}
                    </p>
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
