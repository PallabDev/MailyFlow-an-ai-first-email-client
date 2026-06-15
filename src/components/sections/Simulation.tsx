import { useEffect, useRef, useState } from "react";
import { Check, Sparkles, Send, ArrowRight, Moon, Sun } from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

interface SimDef {
  prompt: string;
  response: string;
  workflowName: string;
}

const SIMS: SimDef[] = [
  {
    workflowName: "Email & Calendar Sync",
    prompt: "Send help@pallabdev.in an email about tomorrow's message and add that event in calendar",
    response: "I've drafted the email to **help@pallabdev.in** regarding tomorrow's message and created the corresponding event on your Google Calendar. Ready for your final approval.",
  },
  {
    workflowName: "Payout Triage",
    prompt: "Find the latest unread investor email from Stripe and summarize payout",
    response: "Found 1 unread message from **Stripe** regarding transaction #TX-9843. Payout of **$12,480.00** initiated on 14/06 and will clear in 2 days. Drafted summary in inbox.",
  },
  {
    workflowName: "Meeting Reschedule",
    prompt: "Move design review meeting to 4pm next Tuesday and alert attendees",
    response: "Rescheduled the **Design Review** meeting to next Tuesday at **4:00 PM** (no calendar conflicts found). Alert updates delivered to nroynibedita02 and 4 other guests.",
  },
];

type Phase = "waiting" | "thinking" | "streaming" | "success";

export default function Simulation() {
  return (
    <section className="relative py-24 md:py-32">
      <div aria-hidden className="absolute inset-0 -z-10 bg-dots opacity-[0.35]" />
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Live simulation"
          title="An AI operating system for your workday"
          subtitle="Give MailyFlow a goal in plain words. Watch it reason, execute, and hand the work back for your approval — in real time."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {SIMS.map((sim, i) => (
            <Reveal key={i} delay={i * 120}>
              <SimWindow def={sim} index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

const PremiumPulsingLoader = () => (
  <div className="flex items-center space-x-1.5 p-3 px-3.5 bg-surface2 border border-line rounded-2xl max-w-[80px] shadow-sm select-none">
    <div className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce"></div>
  </div>
);

function SimWindow({ def, index }: { def: SimDef; index: number }) {
  const [status, setStatus] = useState<Phase>("waiting");
  const [displayedText, setDisplayedText] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat area to bottom during active phases
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [status, displayedText]);

  const handleSend = () => {
    if (status !== "waiting") return;
    setStatus("thinking");

    // 1. Thinking phase for 1.2s
    setTimeout(() => {
      setStatus("streaming");

      // 2. Stream AI response word-by-word
      const words = def.response.split(" ");
      let currentWordIndex = 0;
      setDisplayedText(words[0] || "");

      const interval = setInterval(() => {
        currentWordIndex++;
        if (currentWordIndex < words.length) {
          setDisplayedText((prev) => prev + " " + words[currentWordIndex]);
        } else {
          clearInterval(interval);
          setStatus("success");
        }
      }, 55); // smooth, fast text streaming
    }, 1200);
  };

  // Simple Markdown Bold Parser (**text** -> strong)
  const parseMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-accent-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[400px] overflow-hidden rounded-xl border border-line bg-surface shadow-[0_2px_12px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_12px_-5px_rgba(0,0,0,0.3)]">
      {/* 1. Header (AI Assistant header style) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line bg-surface select-none">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-accent/10 text-accent shrink-0">
            <Sparkles size={11} strokeWidth={2} />
          </span>
          <span className="text-[11px] font-semibold text-text">{def.workflowName}</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
              status === "waiting"
                ? "bg-zinc-300 dark:bg-zinc-600 animate-pulse"
                : status === "thinking"
                ? "bg-amber-400 animate-pulse"
                : status === "streaming"
                ? "bg-accent animate-pulse"
                : "bg-emerald-500"
            }`}
          />
          <span className="capitalize">{status === "waiting" ? "ready" : status === "streaming" ? "typing" : status}</span>
        </div>
      </div>

      {/* 2. Chat Log Panel */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 scrollbar-thin bg-surface2/10"
      >
        {status === "waiting" ? (
          /* Placeholder Splash when waiting */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4 select-none">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center mb-2.5">
              <Sparkles size={14} className="text-accent" />
            </div>
            <p className="text-[10px] text-muted leading-relaxed font-normal px-6">
              Click the highlighted Send button below to trigger MailyFlow's AI Assistant reasoning stream.
            </p>
          </div>
        ) : (
          /* Active Chat Log */
          <>
            {/* User prompt message bubble */}
            <div className="bg-accent/10 border border-line text-text text-[11px] rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[88%] self-end text-left shadow-sm">
              {def.prompt}
            </div>

            {/* AI Response message bubble */}
            {(status === "thinking" || status === "streaming" || status === "success") && (
              <div className="self-start w-full flex flex-col gap-2">
                {status === "thinking" ? (
                  <PremiumPulsingLoader />
                ) : (
                  <div className="bg-surface border border-line text-text text-[11px] rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[88%] self-start text-left shadow-sm leading-relaxed">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-accent-ink uppercase tracking-wider mb-1 select-none">
                      <Sparkles size={9} /> Assistant
                    </div>
                    <div>{parseMarkdown(displayedText)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Final Outcome Approval Badge */}
            {status === "success" && (
              <div className="flex items-center justify-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 py-1.5 text-[10.5px] font-semibold text-accent-ink mt-1 select-none animate-float">
                <Check size={12} strokeWidth={2.5} /> Workflow Complete & Approved
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. Input Bar (Pulsing trigger style) */}
      <div className="border-t border-line bg-surface px-3 py-2.5 flex gap-2 items-center">
        <div
          onClick={handleSend}
          className="flex-1 bg-surface2 border border-line rounded-xl px-3 py-1.5 text-[10.5px] text-text text-left cursor-pointer hover:border-line-strong transition-colors min-h-[52px] flex items-center select-none"
        >
          {status === "waiting" ? (
            <span className="text-text font-normal line-clamp-3 text-wrap break-words">{def.prompt}</span>
          ) : (
            <span className="text-muted italic line-clamp-3 text-wrap break-words">Ask anything...</span>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={status !== "waiting"}
          aria-label="Send query"
          className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            status === "waiting"
              ? "bg-accent text-white hover:scale-105 animate-pulse shadow-[0_0_12px_rgba(110,155,126,0.65)]"
              : "bg-surface2 text-muted border border-line"
          }`}
        >
          <Send size={11} className={status === "waiting" ? "animate-pulse" : ""} />
        </button>
      </div>
    </div>
  );
}
