'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CornerUpLeft, Send } from 'lucide-react';
import { getEmailHtml, parseSender, getInitials, getAvatarColor, formatEmailDate, isHtml } from '@/utils/emailHelper';
import { useChatStore } from '@/store/chatStore';
import toast from 'react-hot-toast';

type Email = {
  id: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  body: string;
  labelIds?: string[];
};

type EmailDetailProps = {
  email: Email;
  onBack: () => void;
  onTrash: (id: string) => void;
  onStar?: (id: string) => void;
};

export default function EmailDetail({
  email,
  onBack: _onBack,
  onTrash: _onTrash,
  onStar: _onStar,
}: EmailDetailProps) {
  const [detailEmail, setDetailEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeHeight, setIframeHeight] = useState('500px');
  const { theme } = useChatStore();
  const isDark = theme === 'dark';

  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const recipient = parseSender(email.from).email || email.from;
      const cleanSubject = email.subject.toLowerCase().startsWith('re:') 
        ? email.subject 
        : `Re: ${email.subject}`;

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: cleanSubject,
          body: replyText,
        }),
      });

      if (res.ok) {
        toast.success('Reply sent successfully!', {
          className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
          iconTheme: {
            primary: 'var(--success)',
            secondary: '#fff',
          },
        });
        setReplyText('');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to send reply.', {
          className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
          iconTheme: {
            primary: 'var(--danger)',
            secondary: '#fff',
          },
        });
      }
    } catch {
      toast.error('Failed to send reply due to network error.', {
        className: 'bg-card text-text-primary border border-border shadow-md rounded-xl text-sm font-medium',
        iconTheme: {
          primary: 'var(--danger)',
          secondary: '#fff',
        },
      });
    } finally {
      setSendingReply(false);
    }
  };

  useEffect(() => {
    if (!email) return;

    // If email body is already available (e.g. mock email), use it immediately
    if (email.body) {
      setDetailEmail(email);
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/emails/detail?id=${email.id}`);
        if (res.ok) {
          const data = await res.json();
          setDetailEmail(data);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to load email body.');
        }
      } catch (err) {
        console.error('Error fetching email details:', err);
        setError('Connection error loading email.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [email.id]);

  useEffect(() => {
    if (detailEmail && email && email.id === detailEmail.id) {
      setDetailEmail((prev) => prev ? { ...prev, labelIds: email.labelIds } : null);
    }
  }, [email.labelIds]);

  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Validate that message is from our specific iframe contentWindow (prevention of wildcard origin vulnerability)
      if (iframeRef.current && e.source === iframeRef.current.contentWindow) {
        if (e.data && e.data.type === 'resize-iframe') {
          setIframeHeight(`${e.data.height}px`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [detailEmail]);

  const emailHtml = React.useMemo(() => {
    if (!detailEmail) return '';
    return getEmailHtml(detailEmail, true, isDark);
  }, [detailEmail?.id, detailEmail?.body, isDark]);

  const isHtmlEmail = React.useMemo(() => {
    return detailEmail ? isHtml(detailEmail.body || '') : false;
  }, [detailEmail]);

  const sender = parseSender(email.from);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-text-primary">
      <div className="flex-1 overflow-y-auto px-[2.5%] py-3 md:p-6 space-y-4 md:space-y-6">
        <div className="space-y-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-extrabold text-text-primary leading-snug break-words [word-break:break-word]">
              {email.subject}
            </h2>
          </div>

          <div className="flex items-center space-x-3 bg-surface-subtle p-2 md:p-4 rounded-xl border border-border">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${getAvatarColor(email.from)}`}>
              {getInitials(email.from)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary font-semibold leading-none">From</p>
              <p className="text-sm font-bold text-text-primary truncate leading-none mt-1">
                {sender.name}
              </p>
              <p className="text-[10px] text-text-muted dark:text-text-secondary break-all mt-1">
                {sender.email}
              </p>
            </div>
          </div>

          <div className="text-xs text-text-muted font-medium">
            Date: <span className="font-semibold text-text-secondary">{formatEmailDate(email.date)}</span>
          </div>
        </div>

        {/* Message Details with Rich Text Render */}
        <div className="border-t border-border pt-6">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-3">Message Body</h4>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="flex items-center space-x-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-success animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-success animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-success animate-bounce"></div>
              </div>
              <span className="text-xs text-text-secondary">Loading email body...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && detailEmail && (
            <>
              <div className={`${isHtmlEmail ? 'bg-white text-black' : 'bg-surface-subtle text-text-primary'} rounded-xl border border-border p-1 md:p-4`}>
                <iframe
                  ref={iframeRef}
                  srcDoc={emailHtml}
                  style={{ height: iframeHeight }}
                  className="w-full border-0 overflow-hidden bg-transparent"
                  scrolling="no"
                  title="Email Body Content"
                  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                />
              </div>

              {/* Inline Reply Form */}
              <div className="border-t border-border pt-4 md:pt-6 mt-6">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-3 flex items-center space-x-1">
                  <CornerUpLeft className="h-3.5 w-3.5 text-text-muted" />
                  <span>Reply</span>
                </h4>
                <div className="bg-card border border-border rounded-xl p-3 md:p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Replying to: <strong>{sender.email || email.from}</strong></span>
                  </div>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    disabled={sendingReply}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-slate-500 transition-all shadow-inner resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="inline-flex items-center space-x-1.5 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          <span>Send Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
