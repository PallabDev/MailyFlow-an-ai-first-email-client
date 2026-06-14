import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

interface FAQItem {
  question: string;
  answer: string;
}

const ITEMS: FAQItem[] = [
  {
    question: "Is my Gmail secure?",
    answer:
      "Yes. MailyFlow connects via Google's official OAuth 2.0 protocol — we never see or store your password. All data in transit is encrypted with TLS 1.3, and we follow Google's API security guidelines. You can revoke access from your Google account at any time.",
  },
  {
    question: "Does AI send emails automatically?",
    answer:
      "No. By default, every AI-generated email is saved as a draft and waits for your explicit approval before anything is sent. MailyFlow is designed around a human-in-the-loop model — the AI does the work, you stay in control of what goes out.",
  },
  {
    question: "Can I approve before sending?",
    answer:
      "Absolutely. Every action — whether it's a reply, a calendar invite, or a workflow — has a dedicated approval gate. You review the output, make any edits you like, and only then confirm. You can also configure auto-approve for low-stakes tasks if you prefer.",
  },
  {
    question: "Does it work with Google Calendar?",
    answer:
      "Yes. MailyFlow has two-way sync with Google Calendar. It can read your availability, create events, send invites, reschedule meetings, and block focus time — all from a plain-language instruction. Support for Outlook Calendar is on the roadmap.",
  },
  {
    question: "Can teams collaborate?",
    answer:
      "Yes, on the Business plan. Shared workspaces let multiple team members connect their inboxes, share workflow templates, and delegate tasks to the AI collectively. Admins can set approval policies and audit logs for full visibility.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section id="faq" className="relative py-24 md:py-32">
      {/* subtle grid backdrop */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-[0.3]" />

      <Container className="flex flex-col items-center gap-14">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          align="center"
        />

        <div className="w-full max-w-2xl flex flex-col gap-3">
          {ITEMS.map((item, i) => (
            <Reveal key={i} delay={i * 70}>
              <AccordionItem
                item={item}
                isOpen={openIndex === i}
                onToggle={() => toggle(i)}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors duration-200 ${
        isOpen ? "border-line-strong bg-surface" : "border-line bg-surface"
      }`}
    >
      {/* trigger */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-text">{item.question}</span>
        <span
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface2 text-muted transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDown size={15} strokeWidth={2} />
        </span>
      </button>

      {/* panel — max-height transition for smooth expand/collapse */}
      <div
        style={{
          maxHeight: isOpen ? "320px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.32s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="border-t border-line px-5 pb-5 pt-4">
          <p className="text-sm leading-relaxed text-muted">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}
