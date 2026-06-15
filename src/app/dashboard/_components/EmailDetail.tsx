'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { getEmailHtml, parseSender, getInitials, getAvatarColor, formatEmailDate } from '@/utils/emailHelper';
import { useChatStore } from '@/store/chatStore';

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
};

export default function EmailDetail({
  email,
  onBack,
  onTrash,
}: EmailDetailProps) {
  const [detailEmail, setDetailEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeHeight, setIframeHeight] = useState('500px');
  const { theme } = useChatStore();
  const isDark = theme === 'dark';

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
      } catch (err: any) {
        console.error('Error fetching email details:', err);
        setError('Connection error loading email.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [email]);

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

  const sender = parseSender(email.from);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-text-primary">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4 shrink-0">
          <h2 className="text-xl font-extrabold text-text-primary leading-snug">
            {email.subject}
          </h2>

          <div className="flex items-center space-x-3 bg-surface-subtle p-4 rounded-xl border border-border">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${getAvatarColor(email.from)}`}>
              {getInitials(email.from)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary font-semibold leading-none">From</p>
              <p className="text-sm font-bold text-text-primary truncate leading-none mt-1">
                {sender.name}
              </p>
              <p className="text-[10px] text-text-muted truncate mt-1">
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
            <div className="bg-surface-subtle rounded-xl border border-border p-4">
              <iframe
                ref={iframeRef}
                srcDoc={getEmailHtml(detailEmail, true, isDark)}
                style={{ height: iframeHeight }}
                className="w-full border-0 overflow-hidden bg-transparent"
                scrolling="no"
                title="Email Body Content"
                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
