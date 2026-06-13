'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { getEmailHtml, parseSender, getInitials, getAvatarColor } from './helpers';

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

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'resize-iframe') {
        setIframeHeight(`${e.data.height}px`);
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
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border shadow-sm ${getAvatarColor(email.from)}`}>
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
            Date: <span className="font-semibold text-text-secondary">{email.date}</span>
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
                srcDoc={getEmailHtml(detailEmail)}
                style={{ height: iframeHeight }}
                className="w-full border-0 overflow-hidden"
                scrolling="no"
                title="Email Body Content"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer / Action Bar */}
      <div className="p-4 border-t border-border bg-surface-subtle flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border border-border bg-card hover:bg-hover-row text-sm font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-sm"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
          <span>Back</span>
        </button>

        <button
          onClick={() => onTrash(email.id)}
          className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 dark:text-red-400 hover:bg-red-100 text-sm font-bold text-red-600 hover:text-red-700 transition-all cursor-pointer shadow-sm"
        >
          <span>Move to Trash</span>
        </button>
      </div>
    </div>
  );
}
