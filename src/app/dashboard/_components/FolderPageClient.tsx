'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Inbox as InboxIcon,
  FileText,
  Send,
  AlertCircle,
  Clock,
  RefreshCw,
  Star,
  PenSquare,
  ChevronLeft
} from 'lucide-react';
import { parseSender, getInitials, getAvatarColor } from './helpers';
import EmailDetail from './EmailDetail';
import ComposeModal from './ComposeModal';

type Email = {
  id: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  body: string;
  labelIds?: string[];
};

type FolderPageClientProps = {
  initialEmails: Email[];
  initialNextPageToken: string | null;
  folder: 'inbox' | 'drafts' | 'sent' | 'spam' | 'trash';
  title: string;
  emailError: string | null;
};

// Mock fallback emails to display if there's no connection
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
  }
];

export default function FolderPageClient({
  initialEmails,
  initialNextPageToken,
  folder,
  title,
  emailError,
}: FolderPageClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [emailsState, setEmailsState] = useState<Email[]>(initialEmails.length > 0 ? initialEmails : mockEmails);
  const [nextPageToken, setNextPageToken] = useState<string | null>(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [starredEmails, setStarredEmails] = useState<Set<string>>(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Sync initial emails when props change
  useEffect(() => {
    setEmailsState(initialEmails.length > 0 ? initialEmails : mockEmails);
    setNextPageToken(initialNextPageToken);
    setSelectedEmail(null);
  }, [initialEmails, initialNextPageToken, folder]);

  // Poll for new emails every 15 seconds (for inbox only)
  useEffect(() => {
    if (folder !== 'inbox') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/emails?limit=20&folder=inbox');
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
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [folder]);

  const loadMoreEmails = async () => {
    if (loadingMore || !nextPageToken) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/emails?pageToken=${encodeURIComponent(nextPageToken)}&limit=50&folder=${folder}`);
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
    if (!nextPageToken || loadingMore) return;
    const target = e.currentTarget;
    const threshold = 150;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    if (isNearBottom) {
      loadMoreEmails();
    }
  };

  const handleTrashEmail = async (emailId: string) => {
    // Optimistic UI update
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

  // Filter based on query and folder
  const filteredEmails = emailsState.filter((email) => {
    const labels = email.labelIds || [];
    if (folder === 'inbox') {
      if (!labels.includes('INBOX') || labels.includes('TRASH') || labels.includes('SPAM')) {
        // Allow mock emails to bypass since label IDs differ
        if (!email.id.startsWith('mock-')) return false;
      }
    } else if (folder === 'drafts') {
      if (!labels.includes('DRAFT') && !email.id.includes('draft')) return false;
    } else if (folder === 'sent') {
      if (!labels.includes('SENT') && !email.id.includes('sent')) return false;
    } else if (folder === 'spam') {
      if (!labels.includes('SPAM') && !email.id.includes('spam')) return false;
    } else if (folder === 'trash') {
      if (!labels.includes('TRASH') && !email.id.includes('trash')) return false;
    }

    return (
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getFolderIcon = () => {
    switch (folder) {
      case 'inbox': return <InboxIcon className="h-5 w-5 text-slate-600" />;
      case 'drafts': return <FileText className="h-5 w-5 text-slate-600" />;
      case 'sent': return <Send className="h-5 w-5 text-slate-600" />;
      case 'spam': return <AlertCircle className="h-5 w-5 text-slate-600" />;
      case 'trash': return <Clock className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
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
            {getFolderIcon()}
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            <span className="text-xs text-slate-500 font-medium">
              {folder === 'inbox' 
                ? `${filteredEmails.filter(e => e.labelIds?.includes('UNREAD')).length} unread` 
                : `${filteredEmails.length} messages`
              }
            </span>
          </div>
        )}

        {!selectedEmail && folder !== 'trash' && (
          <button
            onClick={() => setIsComposeOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-[#3F6257] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2D473E] active:scale-95 transition-all cursor-pointer"
          >
            <PenSquare className="h-4 w-4" />
            <span>Compose</span>
          </button>
        )}
      </div>

      {/* Message Reader / List View */}
      {selectedEmail ? (
        <EmailDetail 
          email={selectedEmail} 
          onBack={() => setSelectedEmail(null)} 
          onTrash={handleTrashEmail} 
        />
      ) : (
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-white"
        >
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
              const isStarred = starredEmails.has(email.id);
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
                    <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border shadow-sm ${getAvatarColor(sender.name)}`}>
                      {getInitials(email.from)}
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-slate-900 leading-tight">
                          {sender.name}
                        </span>
                        <span className="text-xs text-slate-400 font-medium shrink-0">
                          {email.date.replace(/([-+]\d{4}|UTC|GMT)/, '').trim()}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500 truncate leading-relaxed mt-1">
                        <span className="font-semibold text-slate-900 pr-1">{email.subject}</span>
                        <span className="text-slate-400 font-normal">— {email.snippet}</span>
                      </p>
                    </div>
                  </div>

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

            {!nextPageToken && filteredEmails.length > 0 && (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold bg-slate-50/50">
                ✨ End of your inbox list
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose modal */}
      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  );
}
