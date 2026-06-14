import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import Counter from "../ui/Counter";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 50, suffix: "K+", label: "Emails processed" },
  { value: 10, suffix: "K+", label: "Meetings scheduled" },
  { value: 95, suffix: "%",  label: "Approval rate" },
  { value: 500, suffix: "+", label: "Teams" },
];

export default function Stats() {
  return (
    <section className="relative py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="By the numbers"
          title="Teams ship inbox-zero with MailyFlow"
          subtitle="Real results from teams who replaced manual email management with AI-powered workflows."
        />

        {/* stats band */}
        <Reveal y={20}>
          <div className="relative overflow-hidden rounded-xl border border-line bg-surface2">
            {/* dots texture */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-dots opacity-50"
            />

            {/* subtle accent glow at center */}
            <div
              aria-hidden
              className="animate-glow pointer-events-none absolute left-1/2 top-1/2 h-48 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{ background: "var(--glow)", opacity: 0.35 }}
            />

            <div className="relative grid grid-cols-2 divide-x divide-y divide-line md:grid-cols-4 md:divide-y-0">
              {STATS.map((stat, i) => (
                <Reveal key={stat.label} delay={i * 90}>
                  <StatCell stat={stat} />
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function StatCell({ stat }: { stat: Stat }) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-10 text-center">
      <Counter
        value={stat.value}
        suffix={stat.suffix}
        className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl"
      />
      <p className="text-sm leading-snug text-muted">{stat.label}</p>
    </div>
  );
}
