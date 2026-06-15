import { Star } from "lucide-react";
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
  handle?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Honestly, we tried building our own internal email triage script using OpenAI. Complete mess. MailyFlow's MCP orchestration just works out of the box. Saved us weeks.",
    name: "Aarav Mehta",
    role: "Co-founder, DevScale",
    initials: "AM",
    handle: "@aarav_m",
    avatarStyle: "background: var(--accent); color: #fff;",
  },
  {
    quote: "I get around 200 emails a day from merchants. MailyFlow's semantic search is magic—I can search 'merchant complains about stripe refunds last week' and it gets the exact thread.",
    name: "Kavya Nair",
    role: "Product Manager, Razorpay",
    initials: "KN",
    handle: "@kavyanair_",
    avatarStyle: "background: var(--primary); color: #fff;",
  },
  {
    quote: "The Zero-Trust Draft Staging is the only reason our security team approved MailyFlow. The AI drafts replies, but nothing goes out without a human click.",
    name: "Ishaan Sharma",
    role: "Founding Engineer, Khatabook",
    initials: "IS",
    handle: "@ishaan_sha",
    avatarStyle: "background: var(--secondary); color: var(--accent-ink);",
  },
  {
    quote: "MailyFlow's unified dashboard is incredibly fast. Plus, the monthly calendar grid and email feed sync are so seamless. Huge fan of the UX.",
    name: "Ananya Patel",
    role: "Frontend Architect, Swiggy",
    initials: "AP",
    handle: "@ananya_codes",
    avatarStyle: "background: var(--accent); color: #fff;",
  },
  {
    quote: "MailyFlow saves me at least 12 hours a week. The AI context memory is super smart—it actually remembers the thread context up to 20 messages back.",
    name: "Divyanshu Goel",
    role: "CEO, Finflo",
    initials: "DG",
    handle: "@divyanshu_g",
    avatarStyle: "background: var(--primary); color: #fff;",
  },
  {
    quote: "Ditch Gmail's standard UI. MailyFlow is what an email client should be in 2026. The MCP tool calling to auto-update our DB on specific events is insane.",
    name: "Rohan Deshmukh",
    role: "Engineering Lead, CRED",
    initials: "RD",
    handle: "@rohan_d",
    avatarStyle: "background: var(--secondary); color: var(--accent-ink);",
  },
  {
    quote: "My calendar booking link is constantly abused. With MailyFlow, the AI screens calendar requests in my email first. Safe to say my sanity is back.",
    name: "Priya Sen",
    role: "Developer Relations, Hasura",
    initials: "PS",
    handle: "@priyasen_dev",
    avatarStyle: "background: var(--accent); color: #fff;",
  },
  {
    quote: "Our customer success ops went from high-latency to instant. Staged AI drafts let the team review and reply in a single keypress. Brilliant approval gate.",
    name: "Vikram Malhotra",
    role: "VP Engineering, Groww",
    initials: "VM",
    handle: "@vikram_malhotra",
    avatarStyle: "background: var(--primary); color: #fff;",
  },
  {
    quote: "I hate email. I've built five custom scripts to auto-sort my inbox but gave up. MailyFlow solved this for me in 5 minutes. Best purchase this year.",
    name: "Meera Iyer",
    role: "Indie Hacker",
    initials: "MI",
    handle: "@meera_iyer",
    avatarStyle: "background: var(--secondary); color: var(--accent-ink);",
  },
  {
    quote: "Managing candidate outreach was a full-time job. The AI assistant schedules interviews, matches slots, and stages candidate follow-ups perfectly.",
    name: "Aditya Joshi",
    role: "Technical Recruiter, Zepto",
    initials: "AJ",
    handle: "@aditya_j",
    avatarStyle: "background: var(--accent); color: #fff;",
  },
  {
    quote: "No more copy-pasting customer details to HubSpot. The webhooks feed drops incoming messages straight into our dashboard, keeping CRM synced.",
    name: "Riya Verma",
    role: "Operations Lead, Meesho",
    initials: "RV",
    handle: "@riya_v",
    avatarStyle: "background: var(--primary); color: #fff;",
  },
  {
    quote: "Tried other AI clients, they hallucinate and send weird replies. MailyFlow's human-in-the-loop sandboxing is the right way to build AI agents.",
    name: "Siddharth Roy",
    role: "Core Contributor, OpenMail",
    initials: "SR",
    handle: "@siddharth_codes",
    avatarStyle: "background: var(--secondary); color: var(--accent-ink);",
  },
  {
    quote: "We integrated Google Calendar and Gmail in two clicks. The reasoning chain animation on their landing page is exactly what happens under the hood.",
    name: "Neha Gupta",
    role: "Tech Lead, InMobi",
    initials: "NG",
    handle: "@nehagupta_tech",
    avatarStyle: "background: var(--accent); color: #fff;",
  },
  {
    quote: "MailyFlow's semantic email parser handles natural language search better than anything. Our dev ops queries find log updates in seconds.",
    name: "Tarun Kapoor",
    role: "CTO, Zomato Labs",
    initials: "TK",
    handle: "@tarunkapoor",
    avatarStyle: "background: var(--primary); color: #fff;",
  },
  {
    quote: "The UI design of MailyFlow is incredibly premium. It's clean, lightning fast, and feels like a native desktop app. 10/10 UX.",
    name: "Sneha Hegde",
    role: "Product Designer, Jupiter",
    initials: "SH",
    handle: "@sneha_hegde",
    avatarStyle: "background: var(--secondary); color: var(--accent-ink);",
  },
];

export default function Testimonials() {
  // Split into 3 columns
  const col1 = [
    TESTIMONIALS[0],
    TESTIMONIALS[3],
    TESTIMONIALS[6],
    TESTIMONIALS[9],
    TESTIMONIALS[12],
  ];
  const col2 = [
    TESTIMONIALS[1],
    TESTIMONIALS[4],
    TESTIMONIALS[7],
    TESTIMONIALS[10],
    TESTIMONIALS[13],
  ];
  const col3 = [
    TESTIMONIALS[2],
    TESTIMONIALS[5],
    TESTIMONIALS[8],
    TESTIMONIALS[11],
    TESTIMONIALS[14],
  ];

  // Duplicate lists for seamless scrolling
  const col1Doubled = [...col1, ...col1];
  const col2Doubled = [...col2, ...col2];
  const col3Doubled = [...col3, ...col3];

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
          <div className="relative h-[650px] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full marquee-vertical-pause">
              {/* Column 1 */}
              <div className="flex flex-col gap-6 marquee-vertical-track">
                {col1Doubled.map((t, idx) => (
                  <TestimonialCard key={`col1-${idx}`} testimonial={t} />
                ))}
              </div>

              {/* Column 2 */}
              <div className="hidden md:flex flex-col gap-6 marquee-vertical-track-reverse">
                {col2Doubled.map((t, idx) => (
                  <TestimonialCard key={`col2-${idx}`} testimonial={t} />
                ))}
              </div>

              {/* Column 3 */}
              <div className="hidden lg:flex flex-col gap-6 marquee-vertical-track">
                {col3Doubled.map((t, idx) => (
                  <TestimonialCard key={`col3-${idx}`} testimonial={t} />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <GlassCard hover className="flex flex-col gap-4 p-5 text-left select-none">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Colored Initials Avatar */}
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm select-none"
            style={{ ...(parseCSSStyle(testimonial.avatarStyle)) }}
          >
            {testimonial.initials}
          </span>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-text-primary leading-tight">
              {testimonial.name}
            </span>
            <span className="text-xs text-text-muted">
              {testimonial.handle || `@${testimonial.initials.toLowerCase()}_tech`}
            </span>
          </div>
        </div>
        
        {/* Star Rating */}
        <div className="flex gap-0.5 mt-1 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={11}
              strokeWidth={0}
              fill="var(--accent)"
            />
          ))}
        </div>
      </div>

      {/* Quote Body */}
      <p className="text-sm leading-relaxed text-text-secondary">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Role Footer */}
      <div className="flex items-center gap-1.5 border-t border-line/40 pt-3 text-[11px] font-medium text-text-muted">
        <span>{testimonial.role}</span>
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
