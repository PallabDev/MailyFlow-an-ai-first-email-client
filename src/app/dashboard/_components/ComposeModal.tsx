'use client';

import React, { useState } from 'react';
import { X, RefreshCw, Send } from 'lucide-react';

type ComposeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

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
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl relative animate-zoom-in">
        <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-[#F8F9FA] rounded-t-2xl">
          <span className="font-bold text-slate-900 text-sm">Compose New Email</span>
          <button
            onClick={onClose}
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
              onClick={onClose}
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
  );
}
