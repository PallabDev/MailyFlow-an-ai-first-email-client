'use client';

import React, { useState } from 'react';
import { X, RefreshCw, Send, CheckCircle2, AlertCircle, Info as InfoIcon } from 'lucide-react';

type ComposeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
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
        showToast('Email sent successfully!', 'success');
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      showToast('Failed to send email.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      showToast('Please fill out all fields before saving a draft.', 'info');
      return;
    }
    setSavingDraft(true);
    try {
      const res = await fetch('/api/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
        }),
      });

      if (res.ok) {
        showToast('Draft saved successfully!', 'success');
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        // Trigger labels count update and email list refresh
        window.dispatchEvent(new CustomEvent('refresh-labels'));
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save draft', 'error');
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      showToast('Failed to save draft.', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex items-center space-x-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success'
            ? 'bg-card/90 border-success/45 text-text-primary shadow-success/5'
            : toast.type === 'error'
            ? 'bg-card/90 border-danger/45 text-text-primary shadow-danger/5'
            : 'bg-card/90 border-warning/45 text-text-primary shadow-warning/5'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-danger shrink-0" />}
          {toast.type === 'info' && <InfoIcon className="h-5 w-5 text-warning shrink-0" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl relative animate-zoom-in text-text-primary">
        <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-surface-subtle rounded-t-2xl">
          <span className="font-bold text-text-primary text-sm">Compose New Email</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleSendEmail} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">To</label>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all animate-zoom-in"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Subject</label>
            <input
              type="text"
              placeholder="Subject Line"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Body</label>
            <textarea
              rows={6}
              placeholder="Write your email body here..."
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2 px-3.5 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-slate-500 shadow-sm transition-all resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft || sendingEmail}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-hover-row hover:text-text-primary transition-all cursor-pointer bg-card disabled:opacity-50"
            >
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="submit"
              disabled={sendingEmail || savingDraft}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-success hover:opacity-90 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {sendingEmail ? (
                <div className="flex items-center space-x-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></div>
                  <span className="pl-1">Sending...</span>
                </div>
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
  );
}
