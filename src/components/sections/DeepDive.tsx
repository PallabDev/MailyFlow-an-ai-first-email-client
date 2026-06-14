import {
  Check,
  Inbox,
  Sparkles,
  Calendar,
  GitBranch,
  Star,
  Tag,
  Clock,
  CornerUpLeft,
  Zap,
  Filter,
  MessageSquare,
  CalendarDays,
  ChevronRight,
  Circle,
  RefreshCw,
  Plus,
  ChevronLeft,
  MapPin,
  X,
  Trash2,
  Users,
  AlignLeft,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

/* ─── types ─────────────────────────────────────────────────── */

interface DiveRow {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
  flip: boolean; // true = text right, visual left
}

/* ─── faux product screenshots ──────────────────────────────── */

function FauxTitleBar({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-line bg-surface2 px-4 py-2.5">
      <span className="h-2 w-2 rounded-full bg-line-strong" />
      <span className="h-2 w-2 rounded-full bg-line-strong" />
      <span className="h-2 w-2 rounded-full bg-line-strong" />
      <span className="ml-2 text-[11px] font-medium text-muted">{label}</span>
    </div>
  );
}

const getInitials = (sender: string) => {
  if (sender === "Google") return "GO";
  if (sender === "MailyFlow") return "MA";
  if (sender === "Pallab Karmakar") return "PK";
  return sender.slice(0, 2).toUpperCase();
};

const getInitialsStyles = (sender: string) => {
  if (sender === "Google") return "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50";
  if (sender === "MailyFlow") return "bg-red-500/10 text-red-500 dark:text-red-400";
  return "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50";
};

/* Inbox screenshot */
function InboxPreview() {
  const emails = [
    {
      sender: "Google",
      date: "14/06/2026 with 11:25 pm",
      subject: "Security alert",
      snippet: "You allowed mailyflow.in access to some of your Google...",
      unread: true,
    },
    {
      sender: "Google",
      date: "14/06/2026 with 11:25 pm",
      subject: "Security alert",
      snippet: "You allowed mailyflow.in access to some of your Google...",
      unread: true,
    },
    {
      sender: "MailyFlow",
      date: "14/06/2026 with 11:25 pm",
      subject: "New device signed in to your MailyFlow account",
      snippet: "New sign in to your...",
      unread: true,
    },
    {
      sender: "Google",
      date: "14/06/2026 with 10:36 pm",
      subject: "You shared some Google Account data with mailyflow.in",
      snippet: "Keep track...",
      unread: false,
    },
    {
      sender: "Pallab Karmakar",
      date: "14/06/2026 with 02:51 am",
      subject: "Invitation from an unknown sender: Meeting with nroynibedita02 @ S...",
      snippet: "Invitation from...",
      unread: false,
    },
    {
      sender: "Pallab Karmakar",
      date: "14/06/2026 with 02:51 am",
      subject: "Meeting today at 9 AM",
      snippet: "Hi, I scheduled a meeting today at 9:00 AM...",
      unread: false,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_24px_60px_-24px_rgba(17,24,39,0.28)]">
      <FauxTitleBar label="MailyFlow — Inbox" />
      
      {/* Sub Header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 bg-surface select-none">
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] font-semibold text-text">Inbox</span>
          <span className="text-muted text-[10px]"><RefreshCw size={10} /></span>
          <span className="text-[10px] text-muted">15 unread</span>
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-[9.5px] font-semibold text-white hover:brightness-105 active:scale-95 transition-all">
          <Plus size={10} strokeWidth={2.5} />
          <span>Compose</span>
        </button>
      </div>

      {/* email rows */}
      <div className="flex flex-col divide-y divide-line bg-surface max-h-[300px] overflow-y-auto">
        {emails.map((e, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 px-4 py-3 hover:bg-surface2/30 transition-colors last:border-0"
          >
            {/* Initials & Unread status dot */}
            <div className="flex items-center gap-1.5 shrink-0">
              {e.unread ? (
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 shrink-0 opacity-0" />
              )}
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getInitialsStyles(e.sender)} shrink-0`}>
                {getInitials(e.sender)}
              </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 text-left text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate ${e.unread ? "font-semibold text-text" : "text-muted"}`}>{e.sender}</span>
                <span className="shrink-0 text-[8.5px] text-muted">{e.date}</span>
              </div>
              <p className={`truncate mt-0.5 ${e.unread ? "font-medium text-text" : "text-muted"}`}>
                {e.subject} <span className="text-muted font-normal">— {e.snippet}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Triage footer */}
      <div className="flex items-center gap-2 border-t border-line bg-surface2 px-4 py-2.5 select-none">
        <Sparkles size={11} strokeWidth={2} className="text-accent" />
        <span className="text-[10.5px] text-muted text-left">
          AI triaged <strong className="text-text font-semibold">12 emails</strong> &middot; 3 replies drafted
        </span>
        <span className="ml-auto cursor-pointer rounded bg-accent px-2.5 py-1 text-[9.5px] font-medium text-white hover:brightness-105 active:scale-95 transition-all">
          Review
        </span>
      </div>
    </div>
  );
}

/* AI Assistant screenshot */
function AIAssistantPreview() {
  const messages = [
    { role: "user", text: "Summarize my investor emails from this week." },
    { role: "ai",   text: "Found 4 investor emails. Key themes: Q3 metrics request from Maya, term sheet follow-up from Sequoia, intro request from a16z scout." },
    { role: "user", text: "Draft a reply to Maya's email." },
    { role: "ai",   text: "Draft ready. Highlights Q3 ARR growth (+42%), mentions upcoming board deck. Tone: professional, concise." },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_24px_60px_-24px_rgba(17,24,39,0.28)]">
      <FauxTitleBar label="MailyFlow — AI Assistant" />
      <div className="flex flex-col gap-3 p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: m.role === "ai" ? "var(--accent)" : "var(--muted)" }}
            >
              {m.role === "ai" ? <Sparkles size={10} strokeWidth={2} /> : "U"}
            </div>
            <div
              className="max-w-[78%] rounded-lg px-3 py-2 text-[11.5px] leading-snug"
              style={{
                background: m.role === "ai" ? "var(--surface-2)" : "var(--accent)",
                color: m.role === "ai" ? "var(--text)" : "white",
                border: m.role === "ai" ? "1px solid var(--border)" : "none",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {/* thinking indicator */}
        <div className="flex items-center gap-2 pl-8 text-[11px] text-muted">
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "0ms" }} />
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "150ms" }} />
          <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: "300ms" }} />
          <span className="ml-1">Thinking…</span>
        </div>
      </div>
      {/* input */}
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-surface2 px-3 py-2 text-[11.5px] text-muted">
          <MessageSquare size={12} strokeWidth={2} />
          Ask anything about your inbox…
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
          <CornerUpLeft size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/* Calendar screenshot */
const MOCK_CALENDAR_EVENTS: Record<number, Array<{
  title: string;
  time: string;
  description?: string;
  location?: string;
}>> = {
  15: [
    {
      title: "Weekly Standup",
      time: "10:00 AM - 11:00 AM",
      description: "Sync with the core engineering team on release blocker issues and goals for the sprint.",
      location: "meet.google.com/mailyflow-sync"
    },
    {
      title: "Product Review",
      time: "03:00 PM - 04:00 PM",
      description: "Walkthrough of the figr.design landing page integration and custom workflow builder components.",
      location: "HQ Conference Room"
    },
    {
      title: "Investor Call",
      time: "05:00 PM - 05:30 PM",
      description: "Share progress updates, review Q3 metrics, and showcase the sandbox security orchestration demo.",
      location: "Zoom Invite"
    }
  ],
  16: [
    {
      title: "Marketing Sync",
      time: "11:00 AM - 12:00 PM",
      description: "Planning launch campaign, social announcements, and landing page content updates.",
      location: "meet.google.com/mailyflow-mktg"
    },
    {
      title: "Design Check-in",
      time: "02:00 PM - 03:00 PM",
      description: "Review new dark/light mode toggles and layout spacing for the dashboard preview.",
      location: "HQ Cabin B"
    }
  ],
  17: [
    {
      title: "1:1 with Dani",
      time: "09:00 AM - 09:45 AM",
      description: "Bi-weekly sync to discuss engineering roadmap priorities and career growth.",
      location: "Coffee Shop"
    },
    {
      title: "Engineering Sync",
      time: "01:00 PM - 02:00 PM",
      description: "Architectural alignment on database schemas and AI streaming response components.",
      location: "meet.google.com/mailyflow-dev"
    }
  ]
};

function CalendarPreview() {
  const [eventsData, setEventsData] = useState<Record<number, Array<{
    title: string;
    time: string;
    description?: string;
    location?: string;
  }>>>(MOCK_CALENDAR_EVENTS);

  const [monthIndex, setMonthIndex] = useState(5); // 5 = June, 6 = July
  const [selectedDay, setSelectedDay] = useState(15);

  // Modal/Panel states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form states
  const [formSummary, setFormSummary] = useState("");
  const [formTime, setFormTime] = useState("10:00 AM - 11:00 AM");
  const [formDescription, setFormDescription] = useState("");
  const [formLocation, setFormLocation] = useState("");

  const daysArray = monthIndex === 5
    ? [null, ...Array.from({ length: 30 }, (_, i) => i + 1)]
    : [null, null, null, ...Array.from({ length: 31 }, (_, i) => i + 1)];

  const eventsForDay = monthIndex === 5 ? (eventsData[selectedDay] || []) : [];

  const handleAddEventClick = () => {
    setModalMode("create");
    setFormSummary("");
    setFormTime("10:00 AM - 11:00 AM");
    setFormDescription("");
    setFormLocation("");
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEditEventClick = (index: number) => {
    const ev = eventsForDay[index];
    setModalMode("edit");
    setFormSummary(ev.title);
    setFormTime(ev.time);
    setFormDescription(ev.description || "");
    setFormLocation(ev.location || "");
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSummary.trim()) return;

    const newEvent = {
      title: formSummary,
      time: formTime,
      description: formDescription,
      location: formLocation,
    };

    setEventsData((prev) => {
      const dayEvents = [...(prev[selectedDay] || [])];
      if (modalMode === "edit" && editingIndex !== null) {
        dayEvents[editingIndex] = newEvent;
      } else {
        dayEvents.push(newEvent);
      }
      return {
        ...prev,
        [selectedDay]: dayEvents,
      };
    });

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingIndex === null) return;
    setEventsData((prev) => {
      const dayEvents = [...(prev[selectedDay] || [])];
      dayEvents.splice(editingIndex, 1);
      return {
        ...prev,
        [selectedDay]: dayEvents,
      };
    });
    setIsModalOpen(false);
  };

  const totalEventsToday = monthIndex === 5 ? (eventsData[15] || []).length : 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_24px_60px_-24px_rgba(17,24,39,0.28)]">
      <FauxTitleBar label="MailyFlow — Calendar" />
      
      {/* Header */}
      <div className="h-14 px-4 border-b border-line flex items-center justify-between shrink-0 bg-surface select-none">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4.5 w-4.5 text-muted" />
          <h1 className="text-[12px] font-bold text-text">Calendar</h1>

          {/* Refresh Button */}
          <button
            className="p-1 text-muted hover:text-text hover:bg-surface2 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Refresh events"
          >
            <RefreshCw className="h-3 w-3" />
          </button>

          <span className="text-[9.5px] text-muted font-medium bg-surface2 px-1.5 py-0.5 rounded">
            {totalEventsToday} events today
          </span>
        </div>
        <button
          onClick={handleAddEventClick}
          className="inline-flex items-center space-x-1.5 bg-success text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold shadow-sm transition-all hover:brightness-105 active:scale-95 cursor-pointer"
        >
          <span>+ Add Event</span>
        </button>
      </div>

      {/* Calendar body layout: Left/Right Split */}
      <div className="flex flex-col sm:flex-row min-h-[310px] divide-y sm:divide-y-0 sm:divide-x divide-line bg-surface">
        
        {/* LEFT COLUMN: Calendar Month View */}
        <div className="w-full sm:w-[220px] shrink-0 flex flex-col min-h-0 bg-surface">
          {/* Month Selector Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line shrink-0 select-none">
            <h3 className="font-bold text-text text-[11px]">
              {monthIndex === 5 ? "June 2026" : "July 2026"}
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={() => setMonthIndex(prev => prev === 6 ? 5 : 6)}
                className="p-0.5 hover:bg-surface2 rounded text-muted transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMonthIndex(prev => prev === 5 ? 6 : 5)}
                className="p-0.5 hover:bg-surface2 rounded text-muted transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Grid Container */}
          <div className="p-3 bg-surface shrink-0 select-none">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-x-1 text-center text-[9px] font-bold text-muted uppercase tracking-wider mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-0.5">{day}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center text-[10.5px] font-semibold">
              {daysArray.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="py-1"></div>;
                }
                const active = selectedDay === day && monthIndex === 5;
                const todayActive = day === 15 && monthIndex === 5;
                const eventMark = monthIndex === 5 && !!eventsData[day] && eventsData[day].length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(day)}
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className={`h-6.5 w-6.5 flex items-center justify-center text-[9.5px] transition-all ${active
                        ? 'bg-success text-white font-bold rounded-full shadow-sm'
                        : todayActive
                          ? 'border border-success text-success rounded-full font-bold'
                          : 'text-text hover:bg-surface2 rounded-full'
                      }`}>
                      {day}
                    </div>
                    {/* Dot indicator */}
                    <div className="h-0.5 w-full flex items-center justify-center mt-0.5">
                      {eventMark && (
                        <span className={`h-0.75 w-0.75 rounded-full ${active ? 'bg-white' : 'bg-success'}`}></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Event Listing */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface">
          {/* Header for Selected Day Events */}
          <div className="px-4 py-2.5 border-b border-line flex items-center justify-between shrink-0 bg-surface select-none">
            <h3 className="text-[11px] font-bold text-text">
              {monthIndex === 5 
                ? `June ${selectedDay}, 2026` 
                : `July ${selectedDay}, 2026`}
            </h3>
            <span className="text-[9.5px] text-muted font-medium">
              {eventsForDay.length} scheduled
            </span>
          </div>

          {/* Events scrollable list */}
          <div className="flex-1 overflow-y-auto max-h-[200px] divide-y divide-line bg-surface">
            {eventsForDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center py-10 select-none">
                <Calendar className="h-7 w-7 text-muted mb-1 opacity-50" />
                <span className="font-semibold text-text text-[11px]">No events scheduled</span>
                <p className="text-[9.5px] text-muted mt-0.5 max-w-[170px] leading-normal">
                  There are no calendar events scheduled for this day.
                </p>
              </div>
            ) : (
              eventsForDay.map((event, index) => (
                <div
                  key={index}
                  onClick={() => handleEditEventClick(index)}
                  className="p-3 space-y-1.5 hover:bg-surface2/30 transition-colors bg-surface group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[11px] font-bold text-text tracking-tight group-hover:text-success transition-colors text-left">
                      {event.title}
                    </h4>

                    <div className="flex items-center space-x-1 text-[8.5px] text-muted bg-surface2 px-1.5 py-0.5 rounded border border-line shrink-0">
                      <Clock className="h-2.5 w-2.5 text-[#5f7a68]" />
                      <span>{event.time}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-[10px] text-muted leading-relaxed max-w-2xl font-normal text-left">
                      {event.description}
                    </p>
                  )}

                  {event.location && (
                    <div className="flex items-center space-x-1 bg-surface2 px-1.5 py-0.5 rounded border border-line text-[9px] text-muted w-fit">
                      <MapPin className="h-2.5 w-2.5 text-red-500 shrink-0" />
                      <span className="truncate max-w-[160px]">{event.location}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add/Edit Event Overlay Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line-strong rounded-xl w-full max-w-[280px] shadow-xl relative overflow-hidden flex flex-col text-text max-h-[90%] select-none">
            {/* Header */}
            <div className="h-10 px-3 border-b border-line flex items-center justify-between bg-surface2 shrink-0">
              <div className="flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                <span className="font-bold text-text text-[10.5px]">
                  {modalMode === "edit" ? "Edit Event" : "Create Event"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:bg-surface border-0 hover:text-text transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted uppercase tracking-wider block text-left">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sync Session"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg py-1.5 px-2.5 text-[11px] text-text placeholder-muted focus:outline-none focus:border-accent-ink transition-all font-semibold"
                  required
                />
              </div>

              {/* Time */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted uppercase tracking-wider block text-left">Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM - 11:00 AM"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg py-1.5 px-2.5 text-[11px] text-text placeholder-muted focus:outline-none focus:border-accent-ink transition-all"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted uppercase tracking-wider block text-left flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" /> Location
                </label>
                <input
                  type="text"
                  placeholder="Add location or link"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg py-1.5 px-2.5 text-[11px] text-text placeholder-muted focus:outline-none focus:border-accent-ink transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted uppercase tracking-wider block text-left flex items-center gap-1">
                  <AlignLeft className="h-2.5 w-2.5" /> Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, agenda, details..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg py-1.5 px-2.5 text-[11px] text-text placeholder-muted focus:outline-none focus:border-accent-ink transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2.5 border-t border-line shrink-0">
                {modalMode === "edit" ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center space-x-0.5 text-red-500 hover:text-red-700 text-[9.5px] font-bold border-0 bg-transparent transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-2.5 py-1.5 rounded-lg border border-line text-[9.5px] font-bold text-muted hover:bg-surface2 hover:text-text transition-all cursor-pointer bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1 rounded-lg bg-success hover:opacity-95 text-white px-3 py-1.5 text-[9.5px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI suggestion */}
      <div className="flex items-center gap-2 border-t border-line bg-surface2 px-4 py-2.5 select-none">
        <Clock size={11} strokeWidth={2} style={{ color: "var(--accent)" }} />
        <span className="text-[10.5px] text-muted">
          AI found <strong className="text-text">3 open slots</strong> for your investor call
        </span>
        <ChevronRight size={12} strokeWidth={2} className="ml-auto text-muted" />
      </div>
    </div>
  );
}

/* Workflow Automation screenshot */
function WorkflowPreview() {
  const steps = [
    { icon: Filter,       label: "Trigger: New email from investor", status: "done"    },
    { icon: Sparkles,     label: "AI: Classify & extract key info",  status: "done"    },
    { icon: CornerUpLeft, label: "Draft contextual reply",           status: "active"  },
    { icon: Check,        label: "Await your approval",              status: "pending" },
    { icon: Zap,          label: "Send & log to CRM",                status: "pending" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_24px_60px_-24px_rgba(17,24,39,0.28)]">
      <FauxTitleBar label="MailyFlow — Workflow Automation" />
      {/* workflow name */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <GitBranch size={12} strokeWidth={2} style={{ color: "var(--accent)" }} />
        <span className="text-[12px] font-semibold text-text">Investor Email Handler</span>
        <span className="ml-auto rounded-full border border-line bg-surface2 px-2 py-0.5 text-[9.5px] font-medium text-accent-ink">
          Active
        </span>
      </div>
      {/* steps */}
      <div className="flex flex-col gap-0 px-4 py-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isDone = step.status === "done";
          const isActive = step.status === "active";
          return (
            <div key={i} className="flex items-start gap-3">
              {/* connector line */}
              <div className="flex flex-col items-center">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all"
                  style={{
                    background: isDone
                      ? "var(--accent)"
                      : isActive
                      ? "var(--surface-2)"
                      : "var(--surface-2)",
                    border: isActive
                      ? "1.5px solid var(--border-strong)"
                      : isDone
                      ? "none"
                      : "1px solid var(--border)",
                  }}
                >
                  {isDone ? (
                    <Check size={12} strokeWidth={2.5} color="white" />
                  ) : (
                    <Icon
                      size={12}
                      strokeWidth={1.8}
                      style={{ color: isActive ? "var(--accent-ink)" : "var(--muted)" }}
                    />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-px flex-1 my-0.5"
                    style={{
                      height: 14,
                      background: isDone ? "var(--accent)" : "var(--border)",
                      opacity: isDone ? 0.5 : 1,
                    }}
                  />
                )}
              </div>
              <div className="pb-3 pt-1">
                <p
                  className="text-[11.5px] leading-snug"
                  style={{
                    color: isDone
                      ? "var(--muted)"
                      : isActive
                      ? "var(--text)"
                      : "var(--muted)",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {step.label}
                </p>
                {isActive && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-accent-ink">
                    <Circle size={7} strokeWidth={2} style={{ fill: "var(--accent)", color: "var(--accent)" }} />
                    Running…
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* stats */}
      <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
        {[
          { label: "Runs today", value: "24" },
          { label: "Avg time",   value: "1.2s" },
          { label: "Success",    value: "100%" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center py-2.5">
            <span className="font-display text-[15px] font-semibold text-text">{s.value}</span>
            <span className="text-[9.5px] text-muted">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── row data ──────────────────────────────────────────────── */

const ROWS: DiveRow[] = [
  {
    eyebrow: "Inbox",
    title: "Your email, intelligently organized",
    description:
      "MailyFlow reads your inbox the moment it arrives — triaging, labeling, and surfacing what matters. Noise disappears. Signal stays.",
    bullets: [
      "AI triage sorts every email automatically",
      "Priority inbox surfaces what needs your attention",
      "One-click bulk actions on AI-grouped threads",
    ],
    visual: <InboxPreview />,
    flip: false,
  },
  {
    eyebrow: "AI Assistant",
    title: "A co-pilot that knows your context",
    description:
      "Ask anything about your inbox in plain language. The AI assistant reads, summarizes, and drafts — always in your voice.",
    bullets: [
      "Conversational interface over your entire inbox",
      "Smart draft replies that match your tone",
      "Instant summaries of long email threads",
    ],
    visual: <AIAssistantPreview />,
    flip: true,
  },
  {
    eyebrow: "Calendar Integration",
    title: "Scheduling that works while you sleep",
    description:
      "MailyFlow connects your Gmail and Google Calendar to find the best time, send invites, and keep everyone in sync — automatically.",
    bullets: [
      "AI finds open slots across all attendees",
      "Auto-sends invitations and reminders",
      "Reschedules conflicts without back-and-forth",
    ],
    visual: <CalendarPreview />,
    flip: false,
  },
  {
    eyebrow: "Workflow Automation",
    title: "Build once. Run forever.",
    description:
      "Chain triggers, AI steps, and approval gates into powerful automations. Every workflow waits for your sign-off before sending anything.",
    bullets: [
      "Visual workflow builder with AI steps",
      "Approval gates keep you in control",
      "Runs 24/7 — logs every action for review",
    ],
    visual: <WorkflowPreview />,
    flip: true,
  },
];

/* ─── section ───────────────────────────────────────────────── */

export default function DeepDive() {
  return (
    <section className="relative py-24 md:py-32">
      <Container className="flex flex-col gap-20">
        <SectionHeading
          eyebrow="Inside MailyFlow"
          title="Four surfaces, one intelligent workspace"
          subtitle="Every part of MailyFlow is designed to reduce friction and amplify your focus — from inbox to automation."
        />

        {ROWS.map((row, i) => (
          <div
            key={row.eyebrow}
            className={`flex flex-col items-center gap-10 md:gap-16 lg:flex-row ${
              row.flip ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Text side */}
            <Reveal
              delay={80}
              className="flex w-full flex-col gap-5 lg:w-[42%] lg:shrink-0"
            >
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-accent-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {row.eyebrow}
              </span>
              <h3 className="font-display text-2xl font-semibold leading-[1.15] tracking-tight text-text sm:text-3xl">
                {row.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted">
                {row.description}
              </p>
              <ul className="flex flex-col gap-2.5">
                {row.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14px] text-text">
                    <span
                      className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "rgba(129,154,145,0.15)" }}
                    >
                      <Check size={10} strokeWidth={2.5} style={{ color: "var(--accent-ink)" }} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Visual side */}
            <Reveal
              delay={i % 2 === 0 ? 160 : 120}
              className="w-full flex-1"
            >
              <div
                className="transition-transform duration-500 ease-out hover:scale-[1.015]"
                style={{ willChange: "transform" }}
              >
                {row.visual}
              </div>
            </Reveal>
          </div>
        ))}
      </Container>
    </section>
  );
}
