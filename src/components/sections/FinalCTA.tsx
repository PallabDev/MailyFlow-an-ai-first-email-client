import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import Container from "../ui/Container";
import Reveal from "../ui/Reveal";
import Button from "../ui/Button";

// Small floating particle dot
function Particle({
  style,
  className = "",
}: {
  style: React.CSSProperties;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={style}
    />
  );
}

// Blurred glow blob
function GlowBlob({
  style,
}: {
  style: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className="animate-glow pointer-events-none absolute rounded-full blur-3xl"
      style={style}
    />
  );
}

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-28 md:py-40">
      {/* animated grid backdrop */}
      <div
        aria-hidden
        className="bg-grid bg-grid-move absolute inset-0 -z-10 opacity-[0.28]"
      />

      {/* corner glow blobs — placed at edges so they never sit behind headline text */}
      <GlowBlob
        style={{
          width: "480px",
          height: "480px",
          top: "-160px",
          left: "-160px",
          background: "var(--glow)",
          opacity: 0.55,
        }}
      />
      <GlowBlob
        style={{
          width: "420px",
          height: "420px",
          bottom: "-140px",
          right: "-140px",
          background: "var(--glow)",
          opacity: 0.45,
        }}
      />
      <GlowBlob
        style={{
          width: "260px",
          height: "260px",
          top: "50%",
          right: "8%",
          transform: "translateY(-50%)",
          background: "var(--primary)",
          opacity: 0.18,
          animationDelay: "1.2s",
        }}
      />

      {/* floating particles */}
      <Particle
        className="animate-float bg-accent/40"
        style={{ width: "6px", height: "6px", top: "18%", left: "12%", animationDelay: "0s" }}
      />
      <Particle
        className="animate-float bg-primary/50"
        style={{ width: "5px", height: "5px", top: "72%", left: "8%", animationDelay: "1.1s" }}
      />
      <Particle
        className="animate-float bg-secondary/60"
        style={{ width: "7px", height: "7px", top: "30%", right: "14%", animationDelay: "0.6s" }}
      />
      <Particle
        className="animate-float bg-accent/30"
        style={{ width: "5px", height: "5px", top: "65%", right: "10%", animationDelay: "1.8s" }}
      />
      <Particle
        className="animate-float bg-primary/40"
        style={{ width: "4px", height: "4px", top: "82%", left: "22%", animationDelay: "0.9s" }}
      />
      <Particle
        className="animate-float bg-accent/50"
        style={{ width: "6px", height: "6px", top: "12%", right: "22%", animationDelay: "2.2s" }}
      />
      <Particle
        className="animate-float bg-secondary/40"
        style={{ width: "5px", height: "5px", top: "50%", left: "4%", animationDelay: "1.5s" }}
      />
      <Particle
        className="animate-float bg-primary/30"
        style={{ width: "4px", height: "4px", bottom: "18%", right: "18%", animationDelay: "0.3s" }}
      />

      <Container className="relative z-10 flex flex-col items-center text-center">
        <Reveal>
          {/* eyebrow */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-accent-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Your AI email employee is ready
          </span>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-text sm:text-5xl md:text-[58px]">
            Stop Managing Email.{" "}
            <br className="hidden sm:block" />
            <span style={{ color: "var(--accent-ink)" }}>
              Start Managing Outcomes.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
            Connect Gmail and Calendar in 60 seconds. Describe what you need.
            MailyFlow handles the rest — and asks before it acts.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button variant="primary" glow magnetic className="px-6 py-3 text-sm">
                <ArrowRight size={15} strokeWidth={2} />
                Start Free
              </Button>
            </Link>
            <Button variant="secondary" magnetic className="px-6 py-3 text-sm">
              <Play size={15} strokeWidth={1.8} />
              Watch Demo
            </Button>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <p className="mt-6 text-xs text-muted">
            No credit card required &middot; Free plan includes 10 AI operations/day &middot; Cancel anytime
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
