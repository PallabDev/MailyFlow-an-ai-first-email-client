'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Calendar as CalendarIcon,
  Search,
  RefreshCw,
  Clock,
  MapPin,
  LogOut,
  Inbox as InboxIcon,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  X,
  Layers,
  ChevronLeft,
  PenSquare,
  Star,
  Send,
  Sun,
  Bell,
  Settings,
  Sparkles,
  Moon,
  ArrowUp
} from 'lucide-react';

type Email = {
  id: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  body: string;
  labelIds?: string[];
};

type CalendarEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
};

const mockEmails: Email[] = [
  {
    id: 'mock-1',
    from: 'Maya Okonkwo <maya@example.com>',
    date: '9:24 AM',
    subject: 'Q3 roadmap review — can you take a look?',
    snippet: 'I dropped the revised milestones into the doc. The big change is moving the billing rework ahead of...',
    body: 'Hi Alex,\n\nI dropped the revised milestones into the doc. The big change is moving the billing rework ahead of the mobile push. She is asking for a review by EOD — I can draft a reply.\n\nBest,\nMaya',
    labelIds: ['INBOX', 'UNREAD']
  },
  {
    id: 'mock-2',
    from: 'Stripe <stripe@example.com>',
    date: '8:51 AM',
    subject: 'Your payout of $12,480.00 is on the way',
    snippet: 'We initiated a transfer to your bank account ending in 4471. Funds typically arrive within 2 business...',
    body: 'Hello,\n\nWe initiated a transfer to your bank account ending in 4471. Funds typically arrive within 2 business days. Let us know if you have any questions.\n\nThanks,\nStripe Support',
    labelIds: ['INBOX', 'UNREAD']
  },
  {
    id: 'mock-3',
    from: 'Dani Reyes <dani@example.com>',
    date: '8:30 AM',
    subject: 'Design crit moved to 3pm',
    snippet: 'Heads up — pushed the session back an hour so the Tokyo folks can join. Same room, same link.',
    body: 'Hi team,\n\nHeads up — pushed the session back an hour so the Tokyo folks can join. Same room, same link.\n\nSee you there,\nDani',
    labelIds: ['INBOX', 'UNREAD']
  },
  {
    id: 'mock-4',
    from: 'Linear <linear@example.com>',
    date: 'Yesterday',
    subject: '5 issues assigned to you this cycle',
    snippet: 'Your cycle starts Monday. Highest priority: AUTH-204 token refresh edge case. View all in Linear.',
    body: 'Hello,\n\nYour cycle starts Monday. Highest priority: AUTH-204 token refresh edge case. View all in Linear.\n\nBest,\nLinear',
    labelIds: ['INBOX']
  },
  {
    id: 'mock-5',
    from: 'Priya Sharma <priya@example.com>',
    date: 'Yesterday',
    subject: 'Re: Coffee chat next week?',
    snippet: "Tuesday works great on my end. There's a new place near the office that does an incredible cortado.",
    body: "Hi Alex,\n\nTuesday works great on my end. There's a new place near the office that does an incredible cortado.\n\nLet me know if that works,\nPriya",
    labelIds: ['INBOX']
  },
  {
    id: 'mock-6',
    from: 'GitHub <github@example.com>',
    date: 'Yesterday',
    subject: '[agentiflow/core] PR #482 was approved',
    snippet: 'samir-k approved your changes. 2 of 2 required reviews complete. Ready to merge into main.',
    body: 'Hi,\n\nsamir-k approved your changes. 2 of 2 required reviews complete. Ready to merge into main.\n\nGitHub',
    labelIds: ['INBOX']
  },
  {
    id: 'mock-7',
    from: 'Notion <notion@example.com>',
    date: 'Mon',
    subject: 'Weekly digest: 3 pages need your input',
    snippet: 'Teammates left comments on Onboarding v2, Pricing experiments, and the All-hands agenda.',
    body: 'Hello,\n\nTeammates left comments on Onboarding v2, Pricing experiments, and the All-hands agenda.\n\nNotion',
    labelIds: ['INBOX']
  },
  {
    id: 'mock-8',
    from: 'Theo Lindqvist <theo@example.com>',
    date: 'Mon',
    subject: 'Contract draft for review',
    snippet: "Attached the redlined version. Section 4 on data residency is the one I'd love your eyes on first.",
    body: "Hi Alex,\n\nAttached the redlined version. Section 4 on data residency is the one I'd love your eyes on first.\n\nTheo",
    labelIds: ['INBOX']
  },
  {
    id: 'mock-9',
    from: 'Figma <figma@example.com>',
    date: 'Sun',
    subject: 'Aanya shared a file with you',
    snippet: 'AgentiFlow — Marketing site explorations. You have edit access. Open in Figma to start collaborating.',
    body: 'Hello,\n\nAgentiFlow — Marketing site explorations. You have edit access. Open in Figma to start collaborating.\n\nFigma',
    labelIds: ['INBOX']
  },
  {
    id: 'mock-10',
    from: 'Acme Security <acme@example.com>',
    date: 'Sun',
    subject: 'New sign-in from San Francisco, CA',
    snippet: 'We noticed a new sign-in to your account on a Mac. If this was you, no action is needed.',
    body: 'Hi,\n\nWe noticed a new sign-in to your account on a Mac. If this was you, no action is needed.\n\nAcme Security',
    labelIds: ['INBOX']
  },
  {
    id: 'mock-draft-1',
    from: 'investors@corsair.dev',
    date: '10:00 AM',
    subject: 'Seed Round Pitch Deck',
    snippet: "Attached is our updated pitch deck. We'd love to jump on a call next week...",
    body: "Dear investors,\n\nAttached is our updated pitch deck. We'd love to jump on a call next week to walk you through our recent traction and plans.\n\nBest,\nAlex",
    labelIds: ['DRAFT']
  },
  {
    id: 'mock-sent-1',
    from: 'friend@corsair.dev',
    date: 'Yesterday',
    subject: 'Hey! Look forward to our meeting',
    snippet: 'Hey man, just wanted to say I look forward to our meeting next Thursday at 9 AM!',
    body: 'Hey buddy,\n\nJust wanted to say I look forward to our meeting next Thursday at 9 AM! I will send the calendar invite shortly.\n\nCheers,\nAlex',
    labelIds: ['SENT']
  },
  {
    id: 'mock-spam-1',
    from: 'Lottery Winner <win@lottery.com>',
    date: 'Mon',
    subject: 'You won $1,000,000!',
    snippet: 'Claim your lottery prize now! Send your bank details to...',
    body: 'CONGRATULATIONS!\n\nYou have won the grand prize of $1,000,000. To claim your prize, please reply with your bank account details and social security number immediately.\n\nLottery Dept',
    labelIds: ['SPAM']
  },
  {
    id: 'mock-trash-1',
    from: 'Spammy Newsletter <spam@newsletter.com>',
    date: 'Sun',
    subject: 'Weekly Newsletter #59',
    snippet: 'Welcome to our weekly digest. Unsubscribe by clicking here...',
    body: 'Hi subscriber,\n\nHere is your weekly newsletter #59. You can unsubscribe by clicking the link below.\n\nUnsubscribe',
    labelIds: ['TRASH']
  }
];

const mockEvents: CalendarEvent[] = [
  {
    id: 'evt-1',
    summary: 'Weekly Sync with Team',
    description: 'Reviewing the sprint progress, planning milestones, and discussing the roadmap changes.',
    location: 'Google Meet',
    start: { dateTime: new Date().toISOString() },
    end: { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
  },
  {
    id: 'evt-2',
    summary: '1:1 with Maya',
    description: 'Chatting about the Q3 billing rework roadmap and timeline adjustments.',
    location: 'Zoom Meeting',
    start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
    end: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() },
  },
  {
    id: 'evt-3',
    summary: 'Design Crit',
    description: 'Reviewing the marketing site explorations, onboarding v2 designs, and feedback loops.',
    location: 'Figma Huddle',
    start: { dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
    end: { dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() },
  }
];

type DashboardClientProps = {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string;
  };
  activeTenantId: string;
  isDevFallback: boolean;
  emails: Email[];
  initialNextPageToken: string | null;
  emailError: string | null;
  events: CalendarEvent[];
  calendarError: string | null;
  activeTabProp: 'inbox' | 'drafts' | 'sent' | 'spam' | 'trash' | 'calendar';
};

const isHtml = (str: string) => {
  return /<[a-z][\s\S]*>/i.test(str);
};

const formatPlainTextInput = (text: string) => {
  // 1. Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 2. Replace "Text (https://url)" with a link
  // Handles whitespace before/after parentheses and inside (restricted to same line)
  html = html.replace(/([a-zA-Z0-9_'-]+(?:[ \t]+[a-zA-Z0-9_'-]+){0,2})\s*\(\s*(https?:\/\/[^\s)]+)\s*\)/g, (match, anchorText, url) => {
    return `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${anchorText.trim()}</a>`;
  });

  // 3. Replace remaining standalone URLs with a link
  html = html.replace(/(?<!href=")(?<!">)(https?:\/\/[^\s<]+)/g, (match, url) => {
    let cleanedUrl = url.trim().replace(/[.,;)]$/, '');
    let displayUrl = cleanedUrl;
    if (displayUrl.length > 50) {
      displayUrl = displayUrl.substring(0, 47) + '...';
    }
    return `<a href="${cleanedUrl}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`;
  });

  // 4. Convert newlines to break tags
  html = html.replace(/\n/g, '<br />');

  return html;
};

const getEmailHtml = (email: { body: string }) => {
  let rawHtml = email.body;
  if (!isHtml(rawHtml)) {
    rawHtml = formatPlainTextInput(rawHtml);
  }
  return `
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
            margin: 0;
            padding: 16px;
            box-sizing: border-box;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          a { color: #2563eb; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          img { max-width: 100% !important; height: auto; }
          table { max-width: 100% !important; table-layout: fixed !important; }
          * { box-sizing: border-box !important; word-break: break-word !important; }
        </style>
        <script>
          function sendHeight() {
            var height = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.offsetHeight
            );
            window.parent.postMessage({ type: 'resize-iframe', height: height }, '*');
          }
          window.addEventListener('load', sendHeight);
          window.addEventListener('resize', sendHeight);
          document.addEventListener('DOMContentLoaded', sendHeight);
          setTimeout(sendHeight, 100);
          setTimeout(sendHeight, 500);
          setTimeout(sendHeight, 1000);
          setTimeout(sendHeight, 2000);
        </script>
      </head>
      <body>
        ${rawHtml}
      </body>
    </html>
  `;
};

export default function DashboardClient({
  user,
  activeTenantId,
  isDevFallback,
  emails,
  initialNextPageToken,
  emailError,
  events,
  calendarError,
  activeTabProp,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inbox' | 'drafts' | 'sent' | 'spam' | 'trash' | 'calendar'>(activeTabProp || 'inbox');

  const handleTrashEmail = async (emailId: string) => {
    // Optimistic UI update: remove from inbox and move to TRASH
    setEmailsState((prev) =>
      prev.map((e) => {
        if (e.id === emailId) {
          const nextLabels = (e.labelIds || []).filter((l) => l !== 'INBOX');
          if (!nextLabels.includes('TRASH')) nextLabels.push('TRASH');
          return { ...e, labelIds: nextLabels };
        }
        return e;
      })
    );
    setSelectedEmail(null);

    if (!emailId.startsWith('mock-')) {
      try {
        await fetch('/api/trash-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: emailId }),
        });
      } catch (err) {
        console.error('Error calling trash API:', err);
      }
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [iframeHeight, setIframeHeight] = useState('500px');

  // Calendar states
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsState, setEventsState] = useState<CalendarEvent[]>(events && events.length > 0 ? events : []);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [calendarErrorState, setCalendarErrorState] = useState<string | null>(calendarError);

  // Sync activeTab from prop changes
  useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  // Sync initial emails/events when prop changes
  useEffect(() => {
    setEventsState(events && events.length > 0 ? events : []);
    setCalendarErrorState(calendarError);
  }, [events, calendarError]);

  // Navigation helper mapping tab to URL
  const navigateToTab = (tab: 'inbox' | 'drafts' | 'sent' | 'spam' | 'trash' | 'calendar') => {
    setSelectedEmail(null);
    const urlTab = tab === 'drafts' ? 'draft' : tab;
    router.push(`/dashboard/${urlTab}`);
  };

  // Fetch calendar events when month changes
  useEffect(() => {
    if (activeTab !== 'calendar') return;

    const fetchEvents = async () => {
      setEventsLoading(true);
      const year = currentMonthDate.getFullYear();
      const month = currentMonthDate.getMonth();
      
      const start = new Date(year, month - 1, 20);
      const end = new Date(year, month + 1, 10);

      try {
        const res = await fetch(`/api/calendar?timeMin=${encodeURIComponent(start.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}`);
        if (res.ok) {
          const data = await res.json();
          setEventsState(data.events ?? []);
          setCalendarErrorState(null);
        } else {
          const data = await res.json();
          setCalendarErrorState(data.error || 'Failed to fetch events');
        }
      } catch (err: any) {
        console.error('Error fetching calendar events:', err);
        setCalendarErrorState('Failed to fetch calendar events.');
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [currentMonthDate, activeTab]);

  // Ref for chat textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'resize-iframe') {
        setIframeHeight(`${e.data.height}px`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedEmail]);

  // Pagination states
  const [emailsState, setEmailsState] = useState<Email[]>(emails && emails.length > 0 ? emails : mockEmails);
  const [nextPageToken, setNextPageToken] = useState<string | null>(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);

  // Interactive UI states
  const [starredEmails, setStarredEmails] = useState<Set<string>>(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Sidebar toggles
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  // AI Assistant states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hello ${user.firstName || 'there'}! I'm your AI Assistant. How can I help you manage your inbox or calendar today?`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Search input ref for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync prop changes
  useEffect(() => {
    setEmailsState(emails && emails.length > 0 ? emails : mockEmails);
    setNextPageToken(initialNextPageToken);
  }, [emails, initialNextPageToken]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Poll for new emails every 10 seconds (Pub/Sub simulated polling for frontend auto-update)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/emails?limit=20');
        if (res.ok) {
          const data = await res.json();
          if (data.emails && data.emails.length > 0) {
            setEmailsState((prev) => {
              const existingIds = new Set(prev.map((e) => e.id));
              const newEmails = data.emails.filter((e: any) => !existingIds.has(e.id));
              if (newEmails.length > 0) {
                return [...newEmails, ...prev];
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error('Error polling for new emails:', error);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  // Keyboard Shortcuts (Superhuman style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        if (e.key === 'Escape') {
          setIsComposeOpen(false);
          setSelectedEmail(null);
        }
        return;
      }

      // Cmd+K or Ctrl+K to search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // 'i' for Inbox
      if (e.key === 'i') {
        setActiveTab('inbox');
        setSelectedEmail(null);
      }

      // 't' or 'c' for Calendar
      if (e.key === 'c') {
        setActiveTab('calendar');
        setSelectedEmail(null);
      }

      // 'n' for Compose Modal
      if (e.key === 'n') {
        e.preventDefault();
        setIsComposeOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadMoreEmails = async () => {
    if (loadingMore || !nextPageToken) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/emails?pageToken=${encodeURIComponent(nextPageToken)}&limit=50&folder=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        if (data.emails && data.emails.length > 0) {
          setEmailsState((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEmails = data.emails.filter((e: any) => !existingIds.has(e.id));
            return [...prev, ...newEmails];
          });
        }
        setNextPageToken(data.nextPageToken || null);
      }
    } catch (error) {
      console.error('Error loading more emails:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (activeTab === 'calendar' || !nextPageToken || loadingMore) return;
    const target = e.currentTarget;
    const threshold = 150;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    if (isNearBottom) {
      loadMoreEmails();
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;
    setSendingEmail(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
        }),
      });

      if (res.ok) {
        alert('Email sent successfully!');
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to send email'}`);
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendChat = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setChatMessages((prev) => [...prev, data.message]);
        }
      } else {
        const errData = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Error: ${errData.error || 'Something went wrong.'}`
          }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Connection error. Please check your network.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredEmails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter lists based on search and active folder tab
  const filteredEmails = emailsState.filter((email) => {
    // Filter by folder/label
    const labels = email.labelIds || [];
    if (activeTab === 'inbox') {
      if (!labels.includes('INBOX') || labels.includes('TRASH') || labels.includes('SPAM')) return false;
    } else if (activeTab === 'drafts') {
      if (!labels.includes('DRAFT')) return false;
    } else if (activeTab === 'sent') {
      if (!labels.includes('SENT')) return false;
    } else if (activeTab === 'spam') {
      if (!labels.includes('SPAM')) return false;
    } else if (activeTab === 'trash') {
      if (!labels.includes('TRASH')) return false;
    } else {
      return false; // Skip when on calendar tab
    }

    // Filter by search query
    return (
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const eventsList = eventsState.length > 0 ? eventsState : mockEvents;
  const filteredEvents = eventsList.filter(
    (event) =>
      event.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start?.dateTime) {
      const date = new Date(event.start.dateTime);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'All Day';
  };

  const formatEventDate = (event: CalendarEvent) => {
    if (event.start?.dateTime || event.start?.date) {
      const date = new Date(event.start.dateTime || event.start.date || '');
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' });
    }
    return '';
  };

  // Helper to parse "Sender Name <email@xyz.com>"
  const parseSender = (sender: string) => {
    const match = sender.match(/(.*?)\s*<(.*)>/);
    if (match) {
      return { name: match[1].replace(/"/g, ''), email: match[2] };
    }
    return { name: sender, email: '' };
  };

  // Generate initials for avatar
  const getInitials = (from: string) => {
    const sender = parseSender(from);
    const parts = sender.name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return sender.name.slice(0, 2).toUpperCase();
  };

  // Get distinct avatar colors
  const avatarColors = [
    'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]',
    'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]',
    'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]',
    'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]',
    'bg-[#F3E8FD] text-[#A142F4] border-[#E8D0FC]',
    'bg-[#E4F7FB] text-[#007B83] border-[#C2ECF1]',
  ];
  const getAvatarColor = (name: string) => {
    const index = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-slate-800 font-sans antialiased">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className={`border-r border-[#E5E7EB] bg-[#F4F4F5] flex flex-col justify-between transition-all duration-300 ${
        isLeftSidebarCollapsed ? 'w-16' : 'w-60'
      }`}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Toggle Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#E5E7EB] bg-white">
            {!isLeftSidebarCollapsed && (
              <div className="flex items-center space-x-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="font-bold text-slate-900 tracking-tight text-lg">AgentiFlow</span>
              </div>
            )}
            <button
              onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {isLeftSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
            <div className="space-y-1">
              {!isLeftSidebarCollapsed && (
                <div className="flex items-center justify-between px-3 mb-1">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Mail</span>
                  <button className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                </div>
              )}
              <nav className="space-y-0.5">
                <button
                  onClick={() => navigateToTab('inbox')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                    activeTab === 'inbox'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <Mail className="h-4.5 w-4.5 shrink-0" />
                  {!isLeftSidebarCollapsed && (
                    <span className="ml-3 flex-1 text-left">Inbox</span>
                  )}
                  {!isLeftSidebarCollapsed && (
                    <span className="text-xs text-slate-500 font-normal bg-slate-300/60 px-2 py-0.5 rounded">
                      {emailsState.filter(e => e.labelIds?.includes('INBOX') && !e.labelIds?.includes('TRASH') && !e.labelIds?.includes('SPAM')).length || 12}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigateToTab('drafts')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                    activeTab === 'drafts'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <FileText className="h-4.5 w-4.5 shrink-0" />
                  {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Drafts</span>}
                  {!isLeftSidebarCollapsed && (
                    <span className="text-xs text-slate-500 font-normal bg-slate-300/60 px-2 py-0.5 rounded">
                      {emailsState.filter(e => e.labelIds?.includes('DRAFT')).length || 3}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigateToTab('sent')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                    activeTab === 'sent'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <Send className="h-4.5 w-4.5 shrink-0" />
                  {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Sent</span>}
                </button>

                <button
                  onClick={() => navigateToTab('spam')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                    activeTab === 'spam'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Spam</span>}
                  {!isLeftSidebarCollapsed && (
                    <span className="text-xs text-red-500 font-bold bg-red-100 px-2 py-0.5 rounded">
                      {emailsState.filter(e => e.labelIds?.includes('SPAM')).length || 4}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigateToTab('trash')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                    activeTab === 'trash'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <Clock className="h-4.5 w-4.5 shrink-0" />
                  {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Trash</span>}
                </button>
              </nav>
            </div>

            {/* Calendar Section */}
            <div className="space-y-1">
              <nav className="space-y-0.5">
                <button
                  onClick={() => navigateToTab('calendar')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <CalendarIcon className="h-4.5 w-4.5 shrink-0" />
                  {!isLeftSidebarCollapsed && <span className="ml-3 flex-1 text-left">Calendar</span>}
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Storage card & Sign out */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white">
          {!isLeftSidebarCollapsed && (
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Storage</span>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '64%' }}></div>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold block">9.6 GB of 15 GB used</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-8 w-8 rounded-full border border-slate-200"
              />
              {!isLeftSidebarCollapsed && (
                <span className="text-xs font-bold text-slate-700 truncate w-24">
                  {user.firstName || 'User'}
                </span>
              )}
            </div>
            
            {!isLeftSidebarCollapsed && (
              <SignOutButton>
                <button className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer">
                  <LogOut className="h-4 w-4" />
                </button>
              </SignOutButton>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MIDDLE CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#E5E7EB] bg-white">
        {/* Top Header / Search */}
        <header className="h-16 border-b border-[#E5E7EB] flex items-center justify-between px-6 bg-[#F8F9FA] shrink-0">
          {/* Centered Search */}
          <div className="flex-1 max-w-lg mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              ref={searchInputRef}
              placeholder="Search mail, events, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#D1D5DB] rounded-xl py-1.5 pl-10 pr-12 text-sm text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all"
            />
            <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded shadow-sm select-none">
              ⌘K
            </kbd>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-3 text-slate-500">
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer" title="Dark Mode toggle">
              <Moon className="h-4.5 w-4.5" />
            </button>
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer" title="Notifications">
              <Bell className="h-4.5 w-4.5" />
            </button>
            <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer" title="Settings">
              <Settings className="h-4.5 w-4.5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-bold border border-[#D1D5DB] text-slate-700">
              {user.firstName && user.lastName ? (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase() : 'AL'}
            </div>
          </div>
        </header>

        {/* Tab Content Header */}
        <div className="h-16 px-6 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
          {selectedEmail ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedEmail(null)}
                className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <div className="h-4 w-px bg-slate-200"></div>
              <span className="text-sm font-bold text-slate-800 truncate max-w-[350px]">
                {selectedEmail.subject}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {activeTab === 'inbox' && (
                <>
                  <InboxIcon className="h-5 w-5 text-slate-600" />
                  <h1 className="text-lg font-bold text-slate-900">Inbox</h1>
                  <span className="text-xs text-slate-500 font-medium">
                    {emailsState.filter(e => e.labelIds?.includes('INBOX') && e.labelIds?.includes('UNREAD')).length} unread
                  </span>
                </>
              )}
              {activeTab === 'drafts' && (
                <>
                  <FileText className="h-5 w-5 text-slate-600" />
                  <h1 className="text-lg font-bold text-slate-900">Drafts</h1>
                  <span className="text-xs text-slate-500 font-medium">{filteredEmails.length} drafts</span>
                </>
              )}
              {activeTab === 'sent' && (
                <>
                  <Send className="h-5 w-5 text-slate-600" />
                  <h1 className="text-lg font-bold text-slate-900">Sent Messages</h1>
                  <span className="text-xs text-slate-500 font-medium">{filteredEmails.length} sent</span>
                </>
              )}
              {activeTab === 'spam' && (
                <>
                  <AlertCircle className="h-5 w-5 text-slate-600" />
                  <h1 className="text-lg font-bold text-slate-900">Spam</h1>
                  <span className="text-xs text-slate-500 font-medium">{filteredEmails.length} spam</span>
                </>
              )}
              {activeTab === 'trash' && (
                <>
                  <Clock className="h-5 w-5 text-slate-600" />
                  <h1 className="text-lg font-bold text-slate-900">Trash</h1>
                  <span className="text-xs text-slate-500 font-medium">{filteredEmails.length} deleted</span>
                </>
              )}
              {activeTab === 'calendar' && (
                <>
                  <CalendarIcon className="h-5 w-5 text-slate-600" />
                  <h1 className="text-lg font-bold text-slate-900">Agenda</h1>
                  <span className="text-xs text-slate-500 font-medium">{filteredEvents.length} events</span>
                </>
              )}
            </div>
          )}

          {!selectedEmail && activeTab !== 'calendar' && (
            <button
              onClick={() => setIsComposeOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-[#3F6257] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2D473E] active:scale-95 transition-all cursor-pointer"
            >
              <PenSquare className="h-4 w-4" />
              <span>Compose</span>
            </button>
          )}
        </div>

        {/* Scrolling Content List / Email Detail Viewer / Calendar View */}
        {selectedEmail ? (
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4 shrink-0">
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {selectedEmail.subject}
                </h2>

                <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border shadow-sm ${getAvatarColor(selectedEmail.from)}`}>
                    {getInitials(selectedEmail.from)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-semibold leading-none">From</p>
                    <p className="text-sm font-bold text-slate-900 truncate leading-none mt-1">
                      {parseSender(selectedEmail.from).name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-1">
                      {parseSender(selectedEmail.from).email}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  Date: <span className="font-semibold text-slate-600">{selectedEmail.date}</span>
                </div>
              </div>

              {/* Message Details with Rich Text Render */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3">Message Body</h4>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <iframe
                    srcDoc={getEmailHtml(selectedEmail)}
                    style={{ height: iframeHeight }}
                    className="w-full border-0 overflow-hidden"
                    scrolling="no"
                    title="Email Body Content"
                  />
                </div>
              </div>
            </div>

            {/* Footer / Action Bar */}
            <div className="p-4 border-t border-[#E5E7EB] bg-slate-50 flex items-center justify-between shrink-0">
              <button
                onClick={() => setSelectedEmail(null)}
                className="inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border border-[#D1D5DB] bg-white hover:bg-slate-50 text-sm font-bold text-slate-600 hover:text-slate-800 transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
                <span>Back</span>
              </button>

              <button
                onClick={() => handleTrashEmail(selectedEmail.id)}
                className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-sm font-bold text-red-600 hover:text-red-700 transition-all cursor-pointer shadow-sm"
              >
                <span>Move to Trash</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'calendar' ? (
          (() => {
            const getEventsForDate = (date: Date) => {
              return eventsList.filter((event) => {
                if (!event.start?.dateTime && !event.start?.date) return false;
                const startStr = event.start.dateTime || event.start.date || '';
                const eventDate = new Date(startStr);
                return (
                  eventDate.getFullYear() === date.getFullYear() &&
                  eventDate.getMonth() === date.getMonth() &&
                  eventDate.getDate() === date.getDate()
                );
              });
            };

            const year = currentMonthDate.getFullYear();
            const month = currentMonthDate.getMonth();
            
            const firstDayIndex = new Date(year, month, 1).getDay();
            const totalDays = new Date(year, month + 1, 0).getDate();
            
            const daysArray = [];
            for (let i = 0; i < firstDayIndex; i++) {
              daysArray.push(null);
            }
            for (let i = 1; i <= totalDays; i++) {
              daysArray.push(new Date(year, month, i));
            }

            const isToday = (d: Date) => {
              const t = new Date();
              return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
            };

            const isSelected = (d: Date) => {
              return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
            };

            const hasEvents = (d: Date) => {
              return getEventsForDate(d).length > 0;
            };

            const handlePrevMonth = () => {
              setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
            };
            const handleNextMonth = () => {
              setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
            };

            const dailyEvents = getEventsForDate(selectedDate);

            return (
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                
                {/* Month Selector Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
                  <h3 className="font-bold text-slate-800 text-sm">
                    {currentMonthDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Grid Container (Not vertically scrollable) */}
                <div className="p-6 bg-white shrink-0">
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-x-1.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="py-1">{day}</div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-y-2.5 gap-x-1.5 text-center text-sm font-semibold">
                    {daysArray.map((dayDate, idx) => {
                      if (!dayDate) {
                        return <div key={`empty-${idx}`} className="py-2"></div>;
                      }
                      const active = isSelected(dayDate);
                      const todayActive = isToday(dayDate);
                      const eventMark = hasEvents(dayDate);

                      return (
                        <div
                          key={dayDate.toISOString()}
                          onClick={() => setSelectedDate(dayDate)}
                          className="flex flex-col items-center justify-center py-1 cursor-pointer"
                        >
                          <div className={`h-8 w-8 flex items-center justify-center text-xs transition-all ${
                            active
                              ? 'bg-[#3F6257] text-white font-bold rounded-full shadow-md'
                              : todayActive
                              ? 'border border-emerald-500 text-emerald-600 rounded-full font-bold'
                              : 'text-slate-700 hover:bg-slate-100 rounded-full'
                          }`}>
                            {dayDate.getDate()}
                          </div>
                          {/* Dot indicator */}
                          <div className="h-1 w-full flex items-center justify-center">
                            {eventMark && (
                              <span className={`h-1 w-1 rounded-full ${active ? 'bg-white' : 'bg-emerald-500'}`}></span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Divider & Header for Selected Day Events */}
                <div className="px-6 py-3 bg-slate-50 border-t border-b border-slate-200 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Events for {selectedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {dailyEvents.length} Scheduled
                  </span>
                </div>

                {/* Events scrollable list */}
                <div className="flex-1 overflow-y-auto bg-white divide-y divide-slate-100">
                  {calendarErrorState && (
                    <div className="m-6 flex items-start space-x-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-700">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-bold">Calendar API Error:</span> {calendarErrorState}
                        <p className="mt-2 text-xs text-red-800">Ensure your Calendar Google account is connected on the Onboarding screen.</p>
                      </div>
                    </div>
                  )}

                  {!calendarErrorState && dailyEvents.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <CalendarIcon className="h-8 w-8 text-slate-300 mb-2" />
                      <span className="font-semibold text-slate-400 text-sm">No events scheduled</span>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        There are no calendar events scheduled for this day.
                      </p>
                    </div>
                  )}

                  {!calendarErrorState && dailyEvents.map((event, index) => {
                    const isAllDay = !event.start?.dateTime;
                    const eventTime = formatEventTime(event);

                    return (
                      <div key={event.id || index} className="p-4 space-y-2 hover:bg-slate-50/40 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                              {event.summary || '(no title)'}
                            </h3>
                          </div>

                          <div className="flex items-center space-x-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                            <Clock className="h-3 w-3 text-indigo-500" />
                            <span>{isAllDay ? 'All Day' : `${eventTime} - ${event.end?.dateTime ? new Date(event.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`}</span>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-normal">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                          {event.location && (
                            <div className="flex items-center space-x-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                              <span className="truncate max-w-xs">{event.location}</span>
                            </div>
                          )}

                          {event.htmlLink && (
                            <a
                              href={event.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors text-[11px]"
                            >
                              <span>Open in Calendar</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          <div
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto bg-white"
          >
            {/* EMAIL LIST FOR ALL FOLDERS */}
            <div className="divide-y divide-slate-100">
              {emailError && (
                <div className="m-6 flex items-start space-x-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-bold">Gmail API Error:</span> {emailError}
                    <p className="mt-2 text-xs text-red-800">Ensure your Gmail Google account is connected on the Onboarding screen.</p>
                  </div>
                </div>
              )}

              {!emailError && filteredEmails.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <InboxIcon className="h-12 w-12 text-slate-300 mb-3" />
                  <span className="font-semibold text-slate-500">All caught up!</span>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    No emails match your active filters.
                  </p>
                </div>
              )}

              {filteredEmails.map((email, idx) => {
                const sender = parseSender(email.from);
                const isSelected = false;
                const isStarred = starredEmails.has(email.id);
                // Read unread status dynamically from labelIds or index
                const isUnread = email.labelIds ? email.labelIds.includes('UNREAD') : idx < 3;

                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className="group flex items-center px-6 py-4 transition-colors hover:bg-slate-50/80 cursor-pointer relative"
                  >
                    {/* Unread dot indicator on the left margin */}
                    {isUnread && (
                      <div className="absolute left-2.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                    )}

                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* Avatar initials badge */}
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border shadow-sm ${getAvatarColor(sender.name)}`}>
                        {getInitials(email.from)}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-bold text-slate-900 leading-tight">
                            {sender.name}
                          </span>
                          <span className="text-xs text-slate-400 font-medium shrink-0">
                            {email.date.replace(/([-+]\d{4}|UTC|GMT)/, '').trim()}
                          </span>
                        </div>

                        {/* Subject — Snippet formatting */}
                        <p className="text-sm text-slate-500 truncate leading-relaxed mt-1">
                          <span className="font-semibold text-slate-900 pr-1">{email.subject}</span>
                          <span className="text-slate-400 font-normal">— {email.snippet}</span>
                        </p>
                      </div>
                    </div>

                    {/* Star toggle action */}
                    <button
                      onClick={(e) => toggleStar(email.id, e)}
                      className={`p-1 rounded hover:bg-slate-100 transition-colors shrink-0 cursor-pointer ${
                        isStarred ? 'text-amber-500' : 'text-slate-300 group-hover:text-slate-400'
                      }`}
                    >
                      <Star className="h-4.5 w-4.5" fill={isStarred ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })}

              {loadingMore && (
                <div className="flex items-center justify-center p-6 space-x-2.5 bg-slate-50">
                  <RefreshCw className="h-4.5 w-4.5 animate-spin text-slate-500" />
                  <span className="text-xs text-slate-500 font-semibold">Loading more messages...</span>
                </div>
              )}

              {!nextPageToken && emailsState.length > 0 && (
                <div className="text-center py-6 text-xs text-slate-400 font-semibold bg-slate-50/50">
                  ✨ End of your inbox list
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. RIGHT PANEL (AI ASSISTANT CHAT) */}
      <aside className={`border-l border-[#E5E7EB] bg-[#F4F4F5] flex flex-col justify-between transition-all duration-300 relative ${
        isRightSidebarCollapsed ? 'w-12' : 'w-[360px]'
      }`}>
        {/* Toggle Collapse button */}
        <button
          onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          className="absolute -left-3 top-4 p-1 hover:bg-slate-200 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-all shadow-sm z-30 cursor-pointer"
        >
          {isRightSidebarCollapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {isRightSidebarCollapsed ? (
          /* COLLAPSED ASSISTANT COLUMN */
          <div className="flex flex-col items-center py-6 space-y-6">
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
        ) : (
          /* EXPANDED ASSISTANT SIDEBAR */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="h-16 px-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                <span className="font-bold text-slate-900 text-sm">AI Assistant</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active</span>
              </div>
            </div>

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={`flex flex-col space-y-1 max-w-[85%] ${
                      isAssistant ? 'self-start' : 'self-end ml-auto'
                    }`}
                  >
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isAssistant
                        ? 'bg-white border border-[#E5E7EB] text-slate-800'
                        : 'bg-[#E4E9E5] text-slate-800 border border-slate-300/40'
                    }`}>
                      <p className="whitespace-pre-line font-normal">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex items-center space-x-2 text-slate-400 p-2 text-xs font-semibold">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Bottom Actions & Input */}
            <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0">
              {/* Chat Input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat(chatInput);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                  }
                }}
                className="relative w-full flex flex-col"
              >
                <textarea
                  ref={textareaRef}
                  rows={3}
                  placeholder="Ask anything..."
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    if (textareaRef.current) {
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const isMobile = window.matchMedia('(max-width: 767px)').matches;
                      if (isMobile) {
                        return; // default newline on mobile
                      }
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendChat(chatInput);
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                        }
                      }
                    }
                  }}
                  className="w-full bg-[#F3F4F6] border border-[#D1D5DB] rounded-xl py-2.5 pl-4 pr-12 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all shadow-inner resize-none overflow-y-auto"
                  style={{ minHeight: '60px', maxHeight: '180px' }}
                />
                <button
                  type="submit"
                  className="absolute right-2.5 bottom-2.5 p-1.5 rounded-full bg-[#3F6257] text-white hover:bg-[#2D473E] transition-all flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </aside>

      {/* 4. EMAIL DETAILS READER MODAL (Drawn on email click - Centered Modal with HTML Rich-Text iframe isolation) - REMOVED, rendered inline in middle panel now */}

      {/* 5. COMPOSE EMAIL MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl relative animate-zoom-in">
            <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-[#F8F9FA] rounded-t-2xl">
              <span className="font-bold text-slate-900 text-sm">Compose New Email</span>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl py-2 px-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  placeholder="Subject Line"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl py-2 px-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Body</label>
                <textarea
                  rows={6}
                  placeholder="Write your email body here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full bg-white border border-[#D1D5DB] rounded-xl py-2 px-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-[#3F6257] hover:bg-[#2D473E] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
