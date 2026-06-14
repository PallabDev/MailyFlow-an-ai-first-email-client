import { useEffect, useRef, useState, useCallback } from "react";
import {
  Mail,
  Users,
  CalendarCheck,
  CalendarPlus,
  Send,
  Check,
  RefreshCw,
  Sparkles,
  Play,
} from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import Button from "../ui/Button";
import { useReveal } from "../../hooks/useReveal";

/* ─── data ─────────────────────────────────────────────────── */

interface ActionNode {
  id: string;
  label: string;
  icon: typeof Mail;
  x: number; // % of SVG width
  y: number; // % of SVG height
}

const NODES: ActionNode[] = [
  { id: "draft",    label: "Draft Email",       icon: Mail,         x: 50,  y: 6  },
  { id: "team",     label: "Find Team Members", icon: Users,        x: 18,  y: 38 },
  { id: "calendar", label: "Check Calendar",    icon: CalendarCheck,x: 82,  y: 38 },
  { id: "schedule", label: "Schedule Meeting",  icon: CalendarPlus, x: 34,  y: 70 },
  { id: "send",     label: "Send Invitations",  icon: Send,         x: 66,  y: 70 },
];

// Edges: [from-index, to-index]
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 4],
];

const PROMPT = "Email the design team and schedule a review tomorrow.";
const STEP_DELAY = 700; // ms between node activations

/* ─── helpers ──────────────────────────────────────────────── */

function nodeCenter(node: ActionNode, svgW: number, svgH: number) {
  return {
    cx: (node.x / 100) * svgW,
    cy: (node.y / 100) * svgH,
  };
}

/* ─── sub-components ───────────────────────────────────────── */

function WorkflowNode({
  node,
  active,
  done,
  index,
}: {
  node: ActionNode;
  active: boolean;
  done: boolean;
  index: number;
}) {
  const Icon = node.icon;
  return (
    <div
      className="absolute flex flex-col items-center gap-1.5"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%, -50%)",
        transition: `opacity 0.45s ease ${index * 80}ms, transform 0.45s cubic-bezier(0.16,1,0.3,1) ${index * 80}ms`,
        opacity: active || done ? 1 : 0.35,
        zIndex: 10,
      }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-500"
        style={{
          background: done
            ? "var(--accent)"
            : active
            ? "var(--surface)"
            : "var(--surface)",
          borderColor: done
            ? "var(--accent)"
            : active
            ? "var(--border-strong)"
            : "var(--border)",
          boxShadow: done
            ? "0 0 0 4px rgba(129,154,145,0.18)"
            : active
            ? "0 4px 16px -4px rgba(17,24,39,0.14)"
            : "none",
          transform: active && !done ? "scale(1.08)" : "scale(1)",
        }}
      >
        {done ? (
          <Check size={18} strokeWidth={2.5} color="white" />
        ) : (
          <Icon
            size={18}
            strokeWidth={1.8}
            style={{ color: active ? "var(--accent-ink)" : "var(--muted)" }}
          />
        )}
      </div>
      <span
        className="whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-medium leading-tight"
        style={{
          color: done ? "var(--accent-ink)" : "var(--text)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {node.label}
      </span>
    </div>
  );
}

interface EdgePathProps {
  from: ActionNode;
  to: ActionNode;
  drawn: boolean;
  svgW: number;
  svgH: number;
}

function EdgePath({ from, to, drawn, svgW, svgH }: EdgePathProps) {
  const f = nodeCenter(from, svgW, svgH);
  const t = nodeCenter(to, svgW, svgH);
  // slight curve via quadratic bezier
  const mx = (f.cx + t.cx) / 2;
  const my = (f.cy + t.cy) / 2 - 10;
  const d = `M ${f.cx} ${f.cy} Q ${mx} ${my} ${t.cx} ${t.cy}`;

  return (
    <path
      d={d}
      fill="none"
      stroke="var(--accent)"
      strokeWidth="1.5"
      strokeLinecap="round"
      pathLength="1"
      className={`draw-line${drawn ? " drawn" : ""}`}
      style={{ opacity: drawn ? 0.7 : 0.2 }}
    />
  );
}

/* ─── main graph ────────────────────────────────────────────── */

function WorkflowGraph({
  activeIndex,
  running,
}: {
  activeIndex: number;
  running: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 480, h: 260 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: 280 }}
    >
      {/* SVG edges */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        preserveAspectRatio="none"
      >
        {EDGES.map(([fi, ti], ei) => {
          // edge is drawn when the "to" node is active
          const drawn = running && activeIndex >= ti;
          return (
            <EdgePath
              key={ei}
              from={NODES[fi]}
              to={NODES[ti]}
              drawn={drawn}
              svgW={dims.w}
              svgH={dims.h}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {NODES.map((node, i) => (
        <WorkflowNode
          key={node.id}
          node={node}
          index={i}
          active={running && activeIndex === i}
          done={running && activeIndex > i}
        />
      ))}
    </div>
  );
}

/* ─── section ───────────────────────────────────────────────── */

export default function Playground() {
  const { ref: sectionRef, shown } = useReveal<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const runWorkflow = useCallback(() => {
    clearTimers();
    setRunning(true);
    setComplete(false);
    setActiveIndex(-1);

    NODES.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setActiveIndex(i);
      }, (i + 1) * STEP_DELAY);
      timers.current.push(t);
    });

    const done = window.setTimeout(() => {
      setActiveIndex(NODES.length); // all done
      setComplete(true);
    }, (NODES.length + 1) * STEP_DELAY);
    timers.current.push(done);
  }, []);

  // auto-run when section scrolls into view
  useEffect(() => {
    if (shown && !running && !complete) {
      const t = window.setTimeout(runWorkflow, 400);
      timers.current.push(t);
    }
    return clearTimers;
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRun = () => {
    runWorkflow();
  };

  return (
    <section id="playground" className="relative py-24 md:py-32">
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-40" />

      <Container className="flex flex-col items-center gap-14">
        <SectionHeading
          eyebrow="AI Workflows"
          title="Watch one sentence become five actions"
          subtitle="Type a goal in plain language. MailyFlow breaks it into tasks, executes them in parallel, and waits for your approval."
        />

        {/* Prompt bar */}
        <Reveal delay={80} className="w-full max-w-2xl">
          <div className="flex flex-col gap-3 rounded-xl border border-line-strong bg-surface p-4 shadow-[0_4px_24px_-8px_rgba(17,24,39,0.12)]">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wider text-accent-ink">
              <Sparkles size={12} strokeWidth={2} />
              Prompt
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface2 px-4 py-3">
              <span className="flex-1 text-[14px] leading-snug text-text">
                {PROMPT}
              </span>
              <Button
                variant="primary"
                glow
                magnetic
                className="shrink-0 px-4 py-2 text-[13px]"
                onClick={handleRun}
              >
                <Play size={13} strokeWidth={2} />
                Run
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Graph panel */}
        <Reveal delay={160} className="w-full max-w-2xl">
          <div
            ref={sectionRef}
            className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
          >
            {/* titlebar */}
            <div className="flex items-center gap-2 border-b border-line bg-surface2 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-line-strong" />
              <span className="h-2 w-2 rounded-full bg-line-strong" />
              <span className="h-2 w-2 rounded-full bg-line-strong" />
              <span className="ml-2 text-[11px] font-medium text-muted">
                MailyFlow — Workflow Engine
              </span>
              {running && (
                <span className="ml-auto flex items-center gap-1.5 text-[10.5px] font-medium text-accent-ink">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                    style={{ animation: complete ? "none" : "blink 1s step-end infinite" }}
                  />
                  {complete ? "Completed" : "Running"}
                </span>
              )}
            </div>

            {/* graph */}
            <div className="px-6 py-6">
              <WorkflowGraph
                activeIndex={activeIndex}
                running={running}
              />
            </div>

            {/* footer */}
            <div className="border-t border-line px-4 py-3">
              {complete ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[12.5px] text-accent-ink">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                    All 5 actions completed — ready for your approval
                  </div>
                  <button
                    onClick={handleRun}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-surface2 px-3 py-1.5 text-[11.5px] font-medium text-muted transition-all hover:border-line-strong hover:text-text"
                  >
                    <RefreshCw size={12} strokeWidth={2} />
                    Run again
                  </button>
                </div>
              ) : running ? (
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "0ms" }} />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "150ms" }} />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "300ms" }} />
                  <span className="ml-1">Executing workflow…</span>
                </div>
              ) : (
                <p className="text-[12px] text-muted">
                  Click <strong className="text-text">Run</strong> to watch the workflow execute.
                </p>
              )}
            </div>
          </div>
        </Reveal>

        {/* Step legend */}
        <Reveal delay={240}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {NODES.map((node, i) => {
              const Icon = node.icon;
              const done = running && activeIndex > i;
              const active = running && activeIndex === i;
              return (
                <div
                  key={node.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-all duration-300"
                  style={{
                    borderColor: done
                      ? "var(--accent)"
                      : active
                      ? "var(--border-strong)"
                      : "var(--border)",
                    background: done
                      ? "rgba(129,154,145,0.08)"
                      : "var(--surface)",
                    color: done
                      ? "var(--accent-ink)"
                      : active
                      ? "var(--text)"
                      : "var(--muted)",
                  }}
                >
                  {done ? (
                    <Check size={13} strokeWidth={2.5} style={{ color: "var(--accent)" }} />
                  ) : (
                    <Icon size={13} strokeWidth={1.8} />
                  )}
                  {node.label}
                </div>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
