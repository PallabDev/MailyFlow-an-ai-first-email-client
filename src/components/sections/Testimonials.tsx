import { useState, useEffect, useRef, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import GlassCard from "../ui/GlassCard";
import Reveal from "../ui/Reveal";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarStyle: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "MailyFlow cut my inbox time in half. I used to spend 90 minutes every morning just triaging — now I spend 15. The AI drafts are eerily good.",
    name: "Priya Mehta",
    role: "Founder, Stacklane",
    initials: "PM",
    avatarStyle: "background: var(--accent); color: #fff;",
  },
  {
    quote:
      "As an EA managing three executives, MailyFlow is the only tool that actually understands context. Scheduling used to eat my afternoons. Not anymore.",
    name: "Jordan Ellis",
    role: "Executive Assistant, Meridian Capital",
    initials: "JE",
    avatarStyle: "background: var(--primary); color: #fff;",
  },
  {
    quote:
      "We onboarded the whole ops team in a day. The approval gate is brilliant — AI does the heavy lifting, humans stay in control. Exactly what we needed.",
    name: "Sana Okafor",
    role: "Head of Operations, Vanta Labs",
    initials: "SO",
    avatarStyle: "background: var(--secondary); color: var(--accent-ink);",
  },
  {
    quote:
      "I was skeptical about AI email tools after trying three others. MailyFlow is different. It actually reads the thread and drafts something I'd write myself.",
    name: "Marcus Tran",
    role: "Product Lead, Orbit Systems",
    initials: "MT",
    avatarStyle: "background: var(--accent); color: #fff;",
  },
  {
    quote:
      "10 hours saved per week is not an exaggeration. I tracked it. The calendar automation alone is worth the subscription — no more back-and-forth scheduling.",
    name: "Leila Vasquez",
    role: "CEO, Nomad Studio",
    initials: "LV",
    avatarStyle: "background: var(--primary); color: #fff;",
  },
  {
    quote:
      "Our investor update emails used to take two hours to compile. MailyFlow pulls the data, drafts the narrative, and queues it for my review. Game changer.",
    name: "Arjun Kapoor",
    role: "Co-founder, Clearpath AI",
    initials: "AK",
    avatarStyle: "background: var(--secondary); color: var(--accent-ink);",
  },
  {
    quote:
      "MailyFlow's sandbox security gives our compliance team peace of mind. We can run complex auto-replies safely knowing the approval gate is unbreakable.",
    name: "Leah Chen",
    role: "Engineering Director, Bloom Health",
    initials: "LC",
    avatarStyle: "background: var(--accent); color: #fff;",
  },
  {
    quote:
      "We integrated MailyFlow with our CRM via the automated workflow builder. Now, when warm leads email us, AI qualifies them, updates HubSpot, and schedules a call in seconds.",
    name: "Devon Miller",
    role: "Growth Lead, Pilot AI",
    initials: "DM",
    avatarStyle: "background: var(--primary); color: #fff;",
  },
  {
    quote:
      "I've tried every email client on the market. MailyFlow is the first one that doesn't just manage my inbox—it actually handles the work for me.",
    name: "Elena Rostova",
    role: "Managing Partner, Apex Ventures",
    initials: "ER",
    avatarStyle: "background: var(--secondary); color: var(--accent-ink);",
  },
];

const ADVANCE_MS = 3500;

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const intervalRef = useRef<number | null>(null);

  const total = TESTIMONIALS.length;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = total - visibleCount;

  useEffect(() => {
    if (index > maxIndex) {
      setIndex(maxIndex);
    }
  }, [visibleCount, maxIndex, index]);

  const next = useCallback(() => {
    setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = window.setInterval(next, ADVANCE_MS);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [isPaused, next]);

  const translatePct = -(index * (100 / total));

  return (
    <section id="testimonials" className="relative py-24 md:py-32 overflow-hidden">
      {/* subtle dot backdrop */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-dots opacity-40" />

      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by people who hate email"
          subtitle="From founders to EAs — MailyFlow gives back the hours that email used to steal."
        />

        <Reveal delay={100}>
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* overflow clip */}
            <div className="overflow-hidden">
              {/* sliding track */}
              <div
                className="flex"
                style={{
                  transform: `translateX(${translatePct}%)`,
                  transition: "transform 0.55s cubic-bezier(0.16,1,0.3,1)",
                  width: `${(total / visibleCount) * 100}%`,
                }}
              >
                {TESTIMONIALS.map((t, i) => (
                  <div
                    key={i}
                    style={{ width: `${100 / total}%`, padding: "0 10px" }}
                  >
                    <TestimonialCard testimonial={t} />
                  </div>
                ))}
              </div>
            </div>

            {/* prev / next arrows */}
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted shadow-sm transition-all hover:border-line-strong hover:text-text sm:-left-5"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted shadow-sm transition-all hover:border-line-strong hover:text-text sm:-right-5"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </Reveal>

        {/* dot indicators */}
        <Reveal delay={200}>
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="transition-all duration-300"
                style={{
                  width: i === index ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "9999px",
                  background: i === index ? "var(--accent)" : "var(--border-strong)",
                }}
              />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <GlassCard hover className="flex h-full flex-col gap-5 p-6">
      {/* stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            strokeWidth={0}
            fill="var(--accent)"
          />
        ))}
      </div>

      {/* quote */}
      <p className="flex-1 text-sm leading-relaxed text-text">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* author */}
      <div className="flex items-center gap-3 border-t border-line pt-4">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
          style={{ ...(parseCSSStyle(testimonial.avatarStyle)) }}
        >
          {testimonial.initials}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text">{testimonial.name}</span>
          <span className="text-xs text-muted">{testimonial.role}</span>
        </div>
      </div>
    </GlassCard>
  );
}

// Parse inline CSS string to React style object
function parseCSSStyle(css: string): Record<string, string> {
  const result: Record<string, string> = {};
  css.split(";").forEach((rule) => {
    const [prop, val] = rule.split(":");
    if (prop && val) {
      const key = prop.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      result[key] = val.trim();
    }
  });
  return result;
}
