import {
  Mail,
  CalendarDays,
  Bot,
  CalendarClock,
  MessageSquareReply,
  MailCheck,
  Workflow,
  ListTodo,
  CalendarSearch,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Container from "../ui/Container";
import Reveal from "../ui/Reveal";

interface Chip {
  label: string;
  icon: LucideIcon;
}

const TOP_ROW: Chip[] = [
  { label: "Gmail", icon: Mail },
  { label: "Google Calendar", icon: CalendarDays },
  { label: "AI Agents", icon: Bot },
  { label: "Meeting Automation", icon: CalendarClock },
  { label: "Smart Replies", icon: MessageSquareReply },
  { label: "Inbox Zero", icon: MailCheck },
  { label: "Workflow Engine", icon: Workflow },
  { label: "Task Automation", icon: ListTodo },
  { label: "Calendar AI", icon: CalendarSearch },
  { label: "Email AI", icon: Sparkles },
];

const BOTTOM_ROW: Chip[] = [
  { label: "Email AI", icon: Sparkles },
  { label: "Calendar AI", icon: CalendarSearch },
  { label: "Task Automation", icon: ListTodo },
  { label: "Workflow Engine", icon: Workflow },
  { label: "Inbox Zero", icon: MailCheck },
  { label: "Smart Replies", icon: MessageSquareReply },
  { label: "Meeting Automation", icon: CalendarClock },
  { label: "AI Agents", icon: Bot },
  { label: "Google Calendar", icon: CalendarDays },
  { label: "Gmail", icon: Mail },
];

function ChipItem({ chip }: { chip: Chip }) {
  const Icon = chip.icon;
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm text-muted select-none">
      <Icon size={14} strokeWidth={1.75} className="text-accent shrink-0" />
      {chip.label}
    </span>
  );
}

function MarqueeRow({
  chips,
  direction,
}: {
  chips: Chip[];
  direction: "left" | "right";
}) {
  const trackClass =
    direction === "left"
      ? "marquee-track"
      : "marquee-track-r marquee-slow";

  return (
    /* overflow-hidden clip + fade masks container */
    <div className="relative overflow-hidden">
      {/* Left fade mask */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
        style={{
          background: "linear-gradient(to right, var(--bg), transparent)",
        }}
      />
      {/* Right fade mask */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
        style={{
          background: "linear-gradient(to left, var(--bg), transparent)",
        }}
      />

      {/* Track — duplicated twice for seamless loop */}
      <div className={`flex w-max gap-3 ${trackClass}`}>
        {chips.map((chip, i) => (
          <ChipItem key={`a-${i}`} chip={chip} />
        ))}
        {chips.map((chip, i) => (
          <ChipItem key={`b-${i}`} chip={chip} />
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <section className="py-16 md:py-20 overflow-hidden">
      {/* Caption */}
      <Container className="mb-10">
        <Reveal>
          <p className="text-center text-sm font-medium text-muted">
            Connects with the tools you already use
          </p>
        </Reveal>
      </Container>

      {/* Marquee rows — marquee-pause wraps both so hover on either pauses both */}
      <div className="marquee-pause flex flex-col gap-3">
        <MarqueeRow chips={TOP_ROW} direction="left" />
        <MarqueeRow chips={BOTTOM_ROW} direction="right" />
      </div>
    </section>
  );
}
